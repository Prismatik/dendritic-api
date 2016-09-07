echo "> yo redbeard redbeard_test"
rm -rf redbeard_test
yo redbeard redbeard_test --skip-install

pushd ./redbeard_test

docker-compose run redbeard_test npm test
# docker-compose down

popd
rm -rf redbeard_test
