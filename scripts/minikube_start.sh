#!/bin/sh

MINIKUBE_MEMORY=4096 #Mb
MINIKUBE_KUBERNETES_VERSION=1.15.4
MINIKUBE_CPUS=4
MINIKUBE_DISK_SIZE='40g'

startMinikube() {
  MINIKUBE_RUNNING=$(minikube status -p $MINIKUBE_PROFILE | grep apiserver | cut -d ' ' -f 2)

  if [ "$MINIKUBE_RUNNING" = "Running" ]; then
    echo "Minikube already running"
  else
    minikube start -p $MINIKUBE_PROFILE \
      --cpus=$MINIKUBE_CPUS \
      --memory=$MINIKUBE_MEMORY \
      --kubernetes-version=$MINIKUBE_KUBERNETES_VERSION \
      --disk-size=$MINIKUBE_DISK_SIZE \
      --extra-config=apiserver.authorization-mode=RBAC

    minikube addons enable ingress
    minikube addons enable dashboard
    minikube addons enable registry
    minikube addons enable storage-provisioner
    minikube addons enable metrics-server
  fi
}

startMinikube
