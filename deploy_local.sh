#!/bin/sh

MINIKUBE_PROFILE=sci-toolkit

startMinikube()
{
  MINIKUBE_RUNNING=$(minikube status -p $MINIKUBE_PROFILE | grep apiserver | cut -d ' ' -f 2)

  if [ "$MINIKUBE_RUNNING" = "Running" ]; then
    echo "Minikube already running"
  else
    minikube start -p $MINIKUBE_PROFILE \
      --cpus=4 --memory=4096 --kubernetes-version=1.15.4 \
      --disk-size='40g' \
      --extra-config=apiserver.authorization-mode=RBAC
    minikube addons enable ingress
    minikube addons enable dashboard
    minikube addons enable registry
    minikube addons enable storage-provisioner
    minikube addons enable metrics-server
  fi
}

startMinikube

IP=$(minikube -p sci-toolkit ip)

kubectl create ns toolkit --dry-run -o yaml | kubectl apply -f -

helm dependencies update helm/science-toolkit

helm upgrade --install science-toolkit \
             --namespace toolkit \
             --set domain=toolkit.$IP.nip.io \
             --values helm/values-local.yaml \
             helm/science-toolkit
