#!/bin/bash

#  Usage:
#
#   DOCKER_USER=xxxx DOCKER_PASS=**** DOCKER_ORG=terminus7 REPOSITORY_NAME=sci-toolkit-vscode ./update-dockerhub-readme.sh
#

set -e

UNAME=${DOCKER_USER}
UPASS=${DOCKER_PASS}

README_FILEPATH=${README_FILEPATH:="./README.md"}

DOCKER_ORG=${DOCKER_ORG:="$UNAME"}
REPOSITORY_NAME=${REPOSITORY_NAME}

# Quiet by default
DEBUG_OPTIONS="-s"

if [ ! "$DEBUG" = "" ]; then
  DEBUG_OPTIONS="-v"
  set -x
fi

if [ "$UNAME" = "" ] || [ "$UPASS" = "" ]; then
  echo "Missing docker credentials DOCKER_USER or DOCKER_PASS"
  exit 1
fi

if [ "$REPOSITORY_NAME" = "" ] || [ "$DOCKER_ORG" = "" ]; then
  echo "Missing REPOSITORY_NAME or DOCKER_ORG variable"
  exit 1
fi


TOKEN=$(curl $DEBUG_OPTIONS -H "Content-Type: application/json" -X POST -d '{"username": "'${UNAME}'", "password": "'${UPASS}'"}' https://hub.docker.com/v2/users/login/ | jq -r .token)

curl $DEBUG_OPTIONS -H "Authorization: JWT ${TOKEN}" -X PATCH --data-urlencode full_description@${README_FILEPATH} https://hub.docker.com/v2/repositories/${DOCKER_ORG}/${REPOSITORY_NAME}/

echo "Repository ${DOCKER_ORG}/${REPOSITORY_NAME} updated."
