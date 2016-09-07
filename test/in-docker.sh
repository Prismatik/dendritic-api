rm -rf redbeard-test
yo redbeard redbeard-test --skip-install

pushd ./redbeard-test

docker-compose run redbeard-test npm test
docker-compose down

popd
rm -rf redbeard-test
