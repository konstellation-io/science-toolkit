#!/usr/bin/env bash

PREFIX="$1-v"

TAG=`git tag | sort --version-sort | grep -i $PREFIX | tail -1`

echo ${TAG#$PREFIX}
