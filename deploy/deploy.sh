#!/bin/sh

ls -alh

cd app/build

git init
git remote add origin "git@github.com:xiphiaz/xiphiaz.github.io.git"
git add --all

git commit -aF- <<EOF
Automated Travis CI Deployment: https://travis-ci.org/xiphiaz/zakhenry.com/builds/$TRAVIS_BUILD_ID

Branch: $TRAVIS_BRANCH
Build ID: $TRAVIS_BUILD_ID
Build Number: $TRAVIS_BUILD_NUMBER
Commit Hash: $TRAVIS_COMMIT
EOF

git push origin master -f