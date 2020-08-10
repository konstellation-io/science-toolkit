#!/bin/bash

echo "⏳ Check if local Minikube environment is running Science Toolkit..."
minikube -p toolkit status > /dev/null 2>&1
if [ "$?" -ne 0 ]; then
    echo "⚠️️ Error: Tookit Minikube profile does not exist";
    echo "⚠️️ Run the script ./local_env.sh in order to deploy Science Toolkit in your local machine before try an export";
    exit 1;
fi
echo "✔ Done"

echo "⏳ Getting images to be exported..."
IMAGES=$(kubectl get pods -n toolkit -o jsonpath="{..image}" | tr -s '[[:space:]]' '\n' | sort | uniq)
IMAGES=($IMAGES)
echo "✔ Done"

echo "⏳ Creating export folder and cleaning if present..."
FOLDER=toolkit_images
EXPORT_PATH=${PWD}/$FOLDER
[ -d ${EXPORT_PATH} ] || mkdir -p ${EXPORT_PATH}
rm -rf $EXPORT_PATH/*
echo "✔ Done"

echo "⏳ Exporting Science Toolkit Docker images..."
eval $(minikube -p toolkit docker-env)
for (( i=0; i<${#IMAGES[@]}; i++ ))
do
    echo "$i: Exporting Docker image ${IMAGES[$i]} ..."
    IMAGE=$(echo ${IMAGES[$i]} | sed "s/\//-/g")
    docker save ${IMAGES[$i]} -o $EXPORT_PATH/${IMAGE}.gz
done
echo "✔ Done"

echo "⏳ Creating export tar.gz file..."
tar zcvf $FOLDER.tar.gz $FOLDER
echo "✔ Done"
