#!/bin/sh

set -e
if [ "$DEBUG" = "1" ]; then
  set -x
fi

NAMESPACE=$1
DOMAIN=$2

if [ -z "$NAMESPACE" ] || [ -z "$DEPLOY_NAME" ]; then
  echo "Variables NAMESPACE and DOMAIN is required"
  exit 1
fi

echo "Creating self-signed CA certificates for TLS and installing them in the local trust stores"
CA_CERTS_FOLDER=.certs/toolkit
rm -rf ${CA_CERTS_FOLDER}/toolkit
mkdir -p ${CA_CERTS_FOLDER}

if [ -x .certs/mkcert ]; then
  echo "mkcert is installed"
else
  wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.1/mkcert-v1.4.1-linux-amd64
  mv mkcert-v1.4.1-linux-amd64 .certs/mkcert
  chmod +x .certs/mkcert
fi

TRUST_STORES=nss .certs/mkcert --install  *.$DOMAIN
mv _wildcard.* .certs/toolkit

echo "Creating K8S secrets with the CA private keys"
kubectl -n $NAMESPACE create secret tls $DOMAIN-tls-secret --key=$CA_CERTS_FOLDER/_wildcard.$DOMAIN-key.pem --cert=$CA_CERTS_FOLDER/_wildcard.$DOMAIN.pem --dry-run -o yaml | kubectl apply -f -
