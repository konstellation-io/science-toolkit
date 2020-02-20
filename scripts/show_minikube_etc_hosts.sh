#!/bin/sh

MINIKUBE_PROFILE=${1:-minikube}

MINIKUBE_IP=$(minikube ip -p $MINIKUBE_PROFILE)

if [ -z "$MINIKUBE_IP" ]; then
  echo "If you are using a different profile run the script with the profile name."
  exit 1
fi

echo "\n👇 Add the following lines to your /etc/hosts\n"
echo "$MINIKUBE_IP toolkit.local"
echo
