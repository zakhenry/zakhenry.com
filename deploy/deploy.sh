#!/bin/sh

ls -alh
cd build
git config --global user.name "$GIT_NAME"
git config --global  user.email "$GIT_EMAIL"
git init
git remote add origin git@github.com:xiphiaz/xiphiaz.github.io.git
git add --all
git commit -am "TRAVIS_COMMIT: $TRAVIS_COMMIT"
git push origin master -f