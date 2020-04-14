#!/bin/sh

ORIGIN=$1
DEST=$2/$1
if [ -d $DEST ]
then
    rm -rf $DEST
else
    mkdir -p $DEST
fi
cp -R $ORIGIN/* $DEST
