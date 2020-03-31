#!/bin/sh
set -ex

apk update && apk upgrade && apk add curl

curl -LO https://github.com/operator-framework/operator-sdk/releases/download/${SDK_RELEASE_VERSION}/operator-sdk-${SDK_RELEASE_VERSION}-x86_64-linux-gnu
chmod +x operator-sdk-${SDK_RELEASE_VERSION}-x86_64-linux-gnu
mkdir -p /usr/local/bin/
cp operator-sdk-${SDK_RELEASE_VERSION}-x86_64-linux-gnu /usr/local/bin/operator-sdk
rm operator-sdk-${SDK_RELEASE_VERSION}-x86_64-linux-gnu
