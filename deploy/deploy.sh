#!/bin/sh

cd ./build
git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"
git init
git remote add origin git@github.com:xiphiaz/xiphiaz.github.io.git
git add --all
git commit -am "TRAVIS_COMMIT: $TRAVIS_COMMIT"
git push origin master -f