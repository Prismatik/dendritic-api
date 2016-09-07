rm -rf redbeard_test

echo "> yo redbeard redbeard_test"
yo redbeard redbeard_test --skip-install

pushd ./redbeard_test

echo "> yo redbeard:auth"
yo redbeard:auth --skip-install

docker-compose run redbeard_test npm test
# docker-compose down

popd
rm -rf redbeard_test
