#!/bin/sh

set -e
if [ "$DEBUG" = "1" ]; then
  set -x
fi

NAMESPACE=$1
DEPLOY_NAME=$2

if [ -z "$NAMESPACE" ] || [ -z "$DEPLOY_NAME" ]; then
  echo "Variables NAMESPACE and DEPLOY_NAME is required"
  exit 1
fi

if [ -x /usr/local/bin/mkcert ]; then
  echo "mkcert is installed"
else
  wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.1/mkcert-v1.4.1-linux-amd64
  mv mkcert-v1.4.1-linux-amd64 /tmp/mkcert
  chmod +x /tmp/mkcert
fi

echo "Creating self-signed CA certificates for TLS and installing them in the local trust stores"
CA_CERTS_FOLDER=/tmp/certs
# This requires mkcert to be installed/available
echo ${CA_CERTS_FOLDER}
rm -rf ${CA_CERTS_FOLDER}
mkdir -p ${CA_CERTS_FOLDER}
# The CAROOT env variable is used by mkcert to determine where to read/write files
# Reference: https://github.com/FiloSottile/mkcert
CAROOT=${CA_CERTS_FOLDER} mkcert -install

echo "Creating K8S secrets with the CA private keys (will be used by the cert-manager CA Issuer)"
kubectl -n $NAMESPACE create secret tls $DEPLOY_NAME-ca-tls-secret --key=${CA_CERTS_FOLDER}/rootCA-key.pem --cert=${CA_CERTS_FOLDER}/rootCA.pem