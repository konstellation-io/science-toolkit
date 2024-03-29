#!/bin/sh
echo "Disable custom kubeconfig environment"
unset KUBECONFIG

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
export JUPYTERLAB_GPU_IMAGE_TAG=latest
export MLFLOW_TAG=latest
export USER_TOOLS_OPERATOR_TAG=latest
export OAUTH2_PROXY_TAG=latest
export USER_REPO_CLONER_TAG=latest

export SKIP_BUILD=1
export ENABLE_TLS=false
export CHART_EXPORT=false
check_requirements

clean () {
  helm -n $NAMESPACE delete toolkit || true
  (kubectl -n $NAMESPACE get pvc | cut -d' ' -f1 | sed -s 1d | xargs kubectl -n $NAMESPACE delete pvc --force --grace-period=0) || true
  kubectl -n $NAMESPACE delete crd usertools.sci-toolkit.konstellation.io --force --grace-period=0 || true
}


while test $# -gt 0; do
  case "$1" in
    --help)
      echo "local_env - attempt to capture frames"
      echo " "
      echo "options:"
      echo "--help                    show brief help"
      echo "--hard, --dracarys        remove minikube profile entirely"
      echo "--clean, --semi-dracarys  remove resources from minikube, keep profile intact"
      echo "--docker-build            build images locally instead of downloading from registry"
      echo "--export-chart            export chart with latest version of each component"
      exit 0
      ;;
    # WARNING: Doing a hard reset before deploying
    *--hard* | *--dracarys*)
        . ./scripts/minikube_hard_reset.sh
        shift
        ;;
    *--docker-build*)
        export SKIP_BUILD=0
        shift
        ;;
    *--tls*)
        export ENABLE_TLS=true
        shift
        ;;
    *--export-chart*)
        export CHART_EXPORT=true
        shift
        ;;
    *--clean* | *--semi-dracarys*)
        clean
        shift
        ;;
  esac
done

./scripts/replace_env_path.sh

if [ "$CHART_EXPORT" != "true" ]; then
  . ./scripts/minikube_start.sh
fi

if [ "$SKIP_BUILD" != "1" ]; then
  # Setup environment to build images inside minikube
  eval "$(minikube docker-env -p "$MINIKUBE_PROFILE")"

  build_header "dashboard"
  docker build -t terminus7/sci-toolkit-dashboard:latest dashboard

#  build_header "vscode"
#  ./scripts/clean_and_copy.sh common-science-requirements vscode
#  docker build -t terminus7/sci-toolkit-vscode:latest vscode
#  rm -rf vscode/common-science-requirements
#
#  build_header "jupyterlab-gpu-image"
#  ./scripts/clean_and_copy.sh common-science-requirements/ jupyterlab-gpu-image
#  docker build -t terminus7/jupyterlab-gpu:latest jupyterlab-gpu-image
#  rm -rf jupyterlab-gpu-image/common-science-requirements
#
#  build_header "runner-image"
#  ./scripts/clean_and_copy.sh common-science-requirements/ runner-image
#  docker build -t terminus7/sci-toolkit-runner:latest runner-image
#  rm -rf runner-image/common-science-requirements

  build_header "mlflow"
  docker build -t terminus7/mlflow:latest mlflow

  build_header "gitea-oauth2-setup"
  docker build -t terminus7/gitea-oauth2-setup:latest gitea-oauth2-setup

  build_header "user-repo-cloner"
  docker build --network host -t konstellation/user-repo-cloner:latest user-repo-cloner

fi

# Helm v3 needs this the base repo to be added manually
helm repo add stable https://charts.helm.sh/stable

export SDK_RELEASE_VERSION="v0.13.0"
export OPERATOR_SDK_INSTALLED=$(cmd_installed operator-sdk)

if [ "$SKIP_BUILD" != "1" ] && [ "$OPERATOR_SDK_INSTALLED" -eq "1" ]; then
  build_header "user-tools-operator"
  helm dep update user-tools-operator/helm-charts/usertools
  cd user-tools-operator \
  && operator-sdk build terminus7/sci-toolkit-user-tools-operator:latest \
  && cd ..
fi

if [ "$CHART_EXPORT" = "true" ]; then
  helm repo add stable https://charts.helm.sh/stable
  helm repo add jupyterhub https://jupyterhub.github.io/helm-chart/
  helm dep update helm/science-toolkit
  mkdir -p ./helm-chart-exported
  rm -f ./helm-chart-exported/*
  helm package helm/science-toolkit --version 1.0.0-local -d ./helm-chart-exported
  echo "📦 Science Tookit Helm Chart exported "
  exit 0
fi

echo "📚️ Create Namespace if not exist...\n"
kubectl create ns ${NAMESPACE} --dry-run -o yaml | kubectl apply -f -

IP=$(minikube -p $MINIKUBE_PROFILE ip)
export DOMAIN=toolkit.$IP.nip.io

if [ "$ENABLE_TLS" != "false" ]; then
  ./scripts/create_self_signed_cert.sh $NAMESPACE $DOMAIN
fi

echo "📦 Applying helm chart...\n"
helm dep update helm/science-toolkit
helm upgrade \
  --wait \
  --install "${DEPLOY_NAME}" \
  --namespace "${NAMESPACE}" \
  --set domain=$DOMAIN \
  --set tls.enabled=$ENABLE_TLS \
  --set minio.securityContext.runAsUser=0 \
  --set kdl.enabled=$ENABLE_KDL \
  --timeout 60m \
  helm/science-toolkit

if [ "$OPERATOR_SDK_INSTALLED" != "1" ] && [ "$SKIP_BUILD" != "1" ]; then
  echo "\n\n\n"
  echo_warning "¡¡¡¡¡ Operator SDK not installed. Operator image was not built!!!\n\n\n"
fi

echo_green "\n✔️  Done.\n\n"


