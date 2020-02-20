#!/bin/bash

set -e
if [ "$DEBUG" = "1" ]; then
  set -x
fi

. ./scripts/functions.sh

export NAMESPACE=toolkit
export DEPLOY_NAME=toolkit
export MINIKUBE_PROFILE=toolkit
export AUTOLOGIN_TAG="latest"
export JUPYTERHUB_ENABLED=true
export MINIO_ENABLED=true

check_requirements

case $* in
# WARNING: Doing a hard reset before deploying
*--hard* | *--dracarys*)
  . ./scripts/minikube_hard_reset.sh
  ;;
*--skip-build*)
  export SKIP_BUILD=1
  ;;
*--disable-jupyterhub*)
  export JUPYTERHUB_ENABLED=false
  ;;
*--disable-minio*)
  export MINIO_ENABLED=false
  ;;
esac

./scripts/replace_env_path.sh
. ./scripts/minikube_start.sh

IP=$(minikube -p $MINIKUBE_PROFILE ip)

# Setup environment to build images inside minikube
eval "$(minikube docker-env -p "$MINIKUBE_PROFILE")"


if [ "$SKIP_BUILD" != "1" ]; then

  build_header "autologin"
  docker build -t terminus7/sci-toolkit-autologin:latest autologin

  build_header "vscode"
  docker build -t terminus7/sci-toolkit-vscode:latest vscode
fi

# Helm v3 needs this the base repo to be added manually
helm repo add stable https://kubernetes-charts.storage.googleapis.com

export SDK_RELEASE_VERSION="v0.13.0"
export OPERATOR_SDK_INSTALLED=$(cmd_installed operator-sdk)

if [ "$SKIP_BUILD" != "1" ] && [ "$OPERATOR_SDK_INSTALLED" = "1" ]; then
  build_header "vscode-operator"
  helm dep update vscode-operator/helm-charts/codeserver
  cd vscode-operator \
  && operator-sdk build terminus7/sci-toolkit-vscode-operator:latest \
  && cd ..
fi

echo "📚️ Create Namespace if not exist...\n"
kubectl create ns ${NAMESPACE} --dry-run -o yaml | kubectl apply -f -

echo "📦 Applying helm chart...\n"
helm dep update helm/science-toolkit
helm upgrade \
  --wait \
  --install "${DEPLOY_NAME}" \
  --namespace "${NAMESPACE}" \
  --set domain=toolkit.$IP.nip.io \
  helm/science-toolkit

if [ "$OPERATOR_SDK_INSTALLED" != "1" ]; then
  echo "\n\n\n"
  echo_warning "¡¡¡¡¡ Operator SDK not installed. Operator image was not built!!!\n\n\n"
fi

echo_green "\n✔️  Done.\n\n"
