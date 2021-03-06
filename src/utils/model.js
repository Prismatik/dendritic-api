const Ajv = require('ajv');
const uuid = require('uuid');

const { thinky, schema } = require(`${process.cwd()}/config`);

/**
 * Creates a Thiky model based on a schema definition
 *
 * @param {String} model name (in JSON schema)
 * @return {Class} thinky model
 */
exports.create = (modelName, opts = {}) => {
  const modelSchema = schema[modelName];
  const validator = exports.thinkyValidatorFor(modelSchema);
  const Model = thinky.createModel(
    modelSchema.pluralName,
    { /* we are relying on the JSON schema validator to ensure data consitency */ },
    { validator, enforce_extra: 'none', enforce_type: 'none' }
  );

  if (opts.audit) {
    exports.setupAuditLog(Model);
  }

  if (modelSchema.properties.rev) {
    exports.setRevLifecycle(Model);
  }

  if (modelSchema.properties.createdAt || modelSchema.properties.updatedAt) {
    exports.setTimestampsHandling(Model);
  }

  Model.standardQuery = exports.queryBuilder(Model, modelSchema);
  Model.standardFeed = exports.feedBuilder(Model);

  return Model;
};

/**
 * Builds a Thinky compatible data validator out of the JSON Schema
 *
 * @param {Object} model JSON schema
 * @return {Function} thinky compatible validator
 */
exports.thinkyValidatorFor = (schema) => {
  const propsClone = Object.assign({}, schema.properties);
  const schemaClone = Object.assign({}, schema, { properties: propsClone });
  delete schemaClone.properties.createdAt;
  delete schemaClone.properties.updatedAt;
  const ajv = new Ajv({ allErrors: true, v5: true });
  const validate = ajv.compile(schemaClone);
  const humanReadableErrors = errors => errors.map(error => {
    const { dataPath, message, keyword, params: { missingProperty } } = error;
    const path = keyword === 'required' ? `${dataPath}.${missingProperty}` : dataPath;
    const text = keyword === 'required' ? 'is required' : message.replace('should', 'must');

    return `\`${path.replace(/^\./, '')}\` ${text}`;
  });

  return document => {
    if (!validate(document)) {
      throw new thinky.Errors.ValidationError(
        humanReadableErrors(validate.errors).join(', ')
      );
    }
  };
};

/**
 * A standard query builder (used in controllers)
 *
 * @param {Class} thinky model
 * @param {Object} model json schema
 * @return {Function} a query builder
 */
exports.queryBuilder = (model, schema) => (params = {}) => {
  let query = model;
  const filter = {};

  Object.keys(params).forEach(key => {
    if (schema.properties[key]) {
      filter[key] = params[key];
    }
  });

  if (Object.keys(filter).length > 0) {
    query = query.filter(filter);
  }

  if (params.orderBy && schema.properties[params.orderBy]) {
    const direction = params.order || 'asc';
    query = query.orderBy(params.orderBy, direction);
  }

  if (params.skip && !isNaN(parseInt(params.skip, 10))) {
    query = query.skip(parseInt(params.skip, 10));
  }

  if (params.limit && !isNaN(parseInt(params.limit, 10))) {
    query = query.limit(parseInt(params.limit, 10));
  }

  return query;
};

/**
 * Creates a standard change feed for apps
 *
 * @param {Classs} model
 * @return {Function} feed builer
 */
exports.feedBuilder = (Model) => (params = {}) => {
  const changeParams = { includeInitial: true, includeStates: true };

  return Model.standardQuery(params).changes(changeParams).then(feed => Object.assign(feed, {
    listen(callback) {
      let allLoaded = false;

      feed.feed.each((err, doc) => {
        if (err) {
          callback(err);
        } else if (doc.state) {
          if (doc.state === 'ready') {
            callback(null, 'all:loaded', allLoaded = true);
          }
        } else if (doc.new_val && !doc.old_val) {
          callback(null, allLoaded ? 'created' : 'existed', new Model(doc.new_val));
        } else if (!doc.new_val && doc.old_val) {
          callback(null, 'deleted', new Model(doc.old_val));
        } else if (doc.new_val && doc.old_val) {
          callback(null, 'updated', new Model(doc.new_val));
        }
      });
    }
  }));
};

/**
 * Sets up an audit log model that saves previous states of records
 *
 * @param {Class} model
 * @return void
 */
exports.setupAuditLog = Model => {
  const AuditModel = thinky.createModel(
    `${Model.getTableName()}AuditLog`,
    {
      createdAt: Date,
      doc: Object
    }
  );

  Model.post('save', function (next) {
    new AuditModel({
      createdAt: new Date(),
      doc: Object.assign({}, this)
    }).save(next);
  });

  Model.AuditModel = AuditModel;
};

/**
 * Sets up the `rev` properties lifecycles
 *
 * @param {class} thinky model
 * @return void
 */
exports.setRevLifecycle = Model => {
  Model.pre('save', function (next) {
    if (!this.isSaved() && !this.rev) {
      this.rev = uuid.v4();
    }

    next();
  });
};

/**
 * Sets the automatic `createdAt` and `updatedAt` records handling
 *
 * @param {class} thinky model
 * @return void
 */
exports.setTimestampsHandling = Model => {
  Model.pre('save', function (next) {
    this.updatedAt = new Date();

    if (!this.createdAt) {
      this.createdAt = this.updatedAt;
    }

    next();
  });
};

/**
 * The document #update/#replace functionality that
 * takes in account the `rev` versions
 */
const Document = require('thinky/lib/document');

Object.defineProperty(Document.prototype, 'update', {
  enumerable: false,
  value(data) {
    return this.replace(Object.assign({ }, this, data));
  }
});

Object.defineProperty(Document.prototype, 'replace', {
  enumerable: false,
  value(data) {
    const { rev = this.rev } = data || { };
    const applyHooks = hooks => {
      for (const hook of hooks) {
        hook.call(this, () => {});
      }
    };

    // cleaing up all the existing data
    Object.getOwnPropertyNames(this).forEach(key => key !== 'id' && delete this[key]);

    // setting new data with a new `rev` if necessary
    this.merge(Object.assign({ }, data));

    // NOTE: `validate()` can return a Promise
    return Promise.resolve(this.validate()).then(() => {
      const Model = this.getModel();
      const { _thinky: { r }, _pre: { save: preSave }, _post: { save: postSave } } = Model;

      applyHooks(preSave);

      const newData = Object.assign({ }, this, rev ? { rev: uuid.v4() } : { });
      const REV_MISMATCH_ERROR = '`rev` was changed by another update';

      // making a low level `replace` request that validates the current `rev` on the DB side
      return r.table(Model.getTableName()).get(this.id).replace(doc => (
        rev ? r.branch(doc('rev').eq(rev), newData, r.error(REV_MISMATCH_ERROR)) : newData
      )).run()
      .then(result => {
        if (result.first_error === REV_MISMATCH_ERROR) {
          throw new thinky.Errors.ValidationError(REV_MISMATCH_ERROR);
        }

        applyHooks(postSave);

        return Object.assign(this, newData);
      });
    });
  }
});
