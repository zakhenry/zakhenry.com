#!/usr/bin/env bash
git diff --no-index demo/src/bin/tcp-server.rs demo/src/bin/lambda-server.rs > impl.patch
git diff --no-index demo/tests/tcp-server.rs demo/tests/lambda-server.rs > test.patch
