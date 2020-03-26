#!/bin/sh

set -e
if [ "$DEBUG" = "1" ]; then
  set -x
fi

. ./scripts/functions.sh

export NAMESPACE=toolkit
export DEPLOY_NAME=toolkit
export MINIKUBE_PROFILE=toolkit
export GITEA_ADMIN_USER="toolkit-admin"
export GITEA_ADMIN_PASSWORD=123456
export GITEA_URL="http://gitea"

export VSCODE_TAG=latest
export DASHBOARD_TAG=latest
export GITEA_OAUTH2_SETUP_TAG=latest
export JUPYTERLAB_GPU_TAG=latest
export MLFLOW_TAG=latest
export VSCODE_OPERATOR_TAG=latest
export OAUTH2_PROXY_TAG=latest

export SKIP_BUILD=1
check_requirements

clean () {
  helm -n toolkit delete toolkit
  kubectl -n toolkit get pvc | cut -d' ' -f1 | sed -s 1d | xargs kubectl -n toolkit delete pvc --force --grace-period=0
  kubectl -n toolkit delete crd codeservers.sci-toolkit.konstellation.io --force --grace-period=0
}

case $* in
# WARNING: Doing a hard reset before deploying
*--hard* | *--dracarys*)
  . ./scripts/minikube_hard_reset.sh
  ;;
*--docker-build*)
  export SKIP_BUILD=0
  ;;
*--clean* | *--semi-dracarys*)
  clean
  ;;
esac

. ./scripts/minikube_start.sh

IP=$(minikube -p $MINIKUBE_PROFILE ip)
export DOMAIN=toolkit.$IP.nip.io

./scripts/replace_env_path.sh

# Setup environment to build images inside minikube
eval "$(minikube docker-env -p "$MINIKUBE_PROFILE")"

if [ "$SKIP_BUILD" != "1" ]; then

  build_header "dashboard"
  docker build -t terminus7/sci-toolkit-dashboard:latest dashboard

  build_header "vscode"
  docker build -t terminus7/sci-toolkit-vscode:latest vscode

  build_header "gitea-oauth2-setup"
  docker build -t terminus7/gitea-oauth2-setup:latest gitea-oauth2-setup
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
  --timeout 60m \
  helm/science-toolkit

if [ "$OPERATOR_SDK_INSTALLED" != "1" ] && [ "$SKIP_BUILD" != "1" ]; then
  echo "\n\n\n"
  echo_warning "¡¡¡¡¡ Operator SDK not installed. Operator image was not built!!!\n\n\n"
fi

echo_green "\n✔️  Done.\n\n"


