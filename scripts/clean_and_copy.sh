#!/bin/sh

ORIGIN=$1
DEST=$2/$1
if [ -d $DEST ]
then
    rm -rf $DEST/*
fi
mkdir -p $DEST
cp -R $ORIGIN/* $DEST
