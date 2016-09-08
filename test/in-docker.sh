rm -rf redbeard_test

echo "> yo redbeard redbeard_test"
yo redbeard redbeard_test --skip-install

pushd ./redbeard_test

echo "> yo redbeard:auth"
yo redbeard:auth --skip-install
# adding the express-jwt dependnecy without installing it
sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
\2\"express-jwt\": \"^5.0.0\",/" <package.json >package.json.updated
mv package.json.updated package.json

docker-compose run redbeard_test npm test
# docker-compose down

popd
rm -rf redbeard_test
