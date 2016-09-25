rm -rf dendritic_test

echo "> yo dendritic dendritic_test"
yo dendritic dendritic_test --skip-install

pushd ./dendritic_test

echo "> yo dendritic:auth"
yo dendritic:auth --skip-install
# adding the auth dependnecies without installing it
sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
\2\"express-jwt\": \"^5.0.0\",/" <package.json >package.json.updated
mv package.json.updated package.json
sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
\2\"simple-password\": \"^1.0.1\",/" <package.json >package.json.updated
mv package.json.updated package.json

echo "> yo dendritic:resource green_apple"
yo dendritic:resource green_apple --skip-install

echo "> yo dendritic:resource CoolBananas"
yo dendritic:resource CoolBananas --skip-install

echo "> yo dendritic:migration TabsToSpaces"
yo dendritic:migration TabsToSpaces

docker-compose down

echo "> migrate up"
docker-compose run dendritic_test bin/migrate up

echo "> migrate list"
docker-compose run dendritic_test bin/migrate list

echo "> migrate rollback"
docker-compose run dendritic_test bin/migrate rollback

echo "> npm test"
docker-compose run dendritic_test npm test

echo "> npm run lint"
docker-compose run dendritic_test npm run lint

docker-compose down

popd
rm -rf dendritic_test
