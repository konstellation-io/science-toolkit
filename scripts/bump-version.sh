#!/bin/sh

# Simple script to bump patch version of a tag
# Example:
#    ./bump-version.sh "something-v3.4.5-alpha"
#  Output: something-v3.4.6-alpha

RE='\([^0-9]*\)\([0-9]*\)[.]\([0-9]*\)[.]\([0-9]*\)\([0-9A-Za-z-]*\)'

PREFIX=`echo $1 | sed -e "s#$RE#\1#"`
MAJOR=`echo $1 | sed -e "s#$RE#\2#"`
MINOR=`echo $1 | sed -e "s#$RE#\3#"`
PATCH=`echo $1 | sed -e "s#$RE#\4#"`
SUFFIX=`echo $1 | sed -e "s#$RE#\5#"`

# Bump patch version
PATCH=`expr $PATCH + 1`

echo "${PREFIX}${MAJOR}.${MINOR}.${PATCH}${SUFFIX}"
