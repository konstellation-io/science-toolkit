#!/bin/sh

check_requirements() {
  REQUIREMENTS_OK=1

  MINIKUBE_INSTALLED=$(cmd_installed minikube)
  [ "$MINIKUBE_INSTALLED" = "1" ] || (export REQUIREMENTS_OK=0 && echo_warning "Missing Minikube installation")

  ENVSUBT_INSTALLED=$(cmd_installed envsubst)
  [ "$ENVSUBT_INSTALLED" = "1" ] || (export REQUIREMENTS_OK=0 && echo_warning "Missing gettext installation")

  DOCKER_INSTALLED=$(cmd_installed docker)
  [ "$DOCKER_INSTALLED" = "1" ] || (export REQUIREMENTS_OK=0 && echo_warning "Missing docker command")

  KUBECTL_INSTALLED=$(cmd_installed helm)
  [ "$KUBECTL_INSTALLED" = "1" ] || (export REQUIREMENTS_OK=0 && echo_warning "Missing kubectl command")

  HELM_INSTALLED=$(cmd_installed helm)
  [ "$HELM_INSTALLED" = "1" ] || (export REQUIREMENTS_OK=0 && echo_warning "Missing helm command")

  if [ "$REQUIREMENTS_OK" = "0" ]; then
    exit 1
  fi
}

cmd_installed() {
  if command -v $1 >/dev/null 2>&1; then
    echo 1
  else
    echo 0
  fi
}

echo_warning() {
  echo "\033[31m⚠️️  $1\033[m"
}

echo_green() {
  echo "\033[92m$1\033[m"
}

build_header() {
  echo "\n\n#########################################"
  printf "##  🏭  %-28s   ##\n" "$@"
  echo "#########################################\n\n"
}
