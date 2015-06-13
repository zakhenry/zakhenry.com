#!/bin/sh

ls -alh

cd app/build

git config --local -l
git init
git remote add origin "git@github.com:xiphiaz/xiphiaz.github.io.git"
git add --all
git commit -am "TRAVIS_COMMIT: $TRAVIS_COMMIT"
git push origin master -f