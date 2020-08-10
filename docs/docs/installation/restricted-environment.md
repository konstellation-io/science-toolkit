---
title: "Installation on restricted environment"
linkTitle: "Installation on restriced environment"
weight: 50
description: >
  How to start the Science Toolkit on a restricted environment
---


# Context

Sometimes there are project where the data are very sensitive and the access to those is only posible from a very 
restricted environment, withut Internet access and with traced remote access to the Science Toolkit via VDI, VPN, etc..

To achieve the installation of Science Toolkit on these kind of environment is necesary to upload the Docker images through the required security protocols of the organization where th Science Toolkit is going to be deployed, that means that we need to pass all the Docker images as files instead of URL of a Docker registry to be downloaded by the Helm installation process. 

## How to export the Science Toolkit Docker images

The first step is to deploy the local environment running in a local machine the script from the repository root `./local_env.sh`. This scrip will deploy in a Minikube environment the Science Toolkit. 

```bash
./local_env.sh
Disable custom kubeconfig environment
😄  [toolkit] minikube v1.12.1 on Ubuntu 20.04
    ▪ MINIKUBE_PROFILE=toolkit
✨  Using the docker driver based on user configuration
👍  Starting control plane node toolkit in cluster toolkit
🎉  minikube 1.12.2 is available! Download it: https://github.com/kubernetes/minikube/releases/tag/v1.12.2
💡  To disable this notice, run: 'minikube config set WantUpdateNotification false'

🔥  Creating docker container (CPUs=4, Memory=8192MB) ...
🐳  Preparing Kubernetes v1.15.4 on Docker 19.03.2 ...
    ▪ apiserver.authorization-mode=RBAC
    > kubectl.sha1: 41 B / 41 B [----------------------------] 100.00% ? p/s 0s
    > kubeadm.sha1: 41 B / 41 B [----------------------------] 100.00% ? p/s 0s
    > kubelet.sha1: 41 B / 41 B [----------------------------] 100.00% ? p/s 0s
    > kubeadm: 38.32 MiB / 38.32 MiB [---------------] 100.00% 22.69 MiB p/s 2s
    > kubectl: 40.99 MiB / 40.99 MiB [---------------] 100.00% 20.24 MiB p/s 2s
    > kubelet: 114.15 MiB / 114.15 MiB [-------------] 100.00% 32.58 MiB p/s 4s
🔎  Verifying Kubernetes components...
🌟  Enabled addons: default-storageclass, storage-provisioner
🏄  Done! kubectl is now configured to use "toolkit"

❗  /usr/local/bin/kubectl is version 1.18.0, which may be incompatible with Kubernetes 1.15.4.
💡  You can also use 'minikube kubectl -- get pods' to invoke a matching version
🔎  Verifying ingress addon...
🌟  The 'ingress' addon is enabled
🌟  The 'dashboard' addon is enabled
🔎  Verifying registry addon...
🌟  The 'registry' addon is enabled
🌟  The 'storage-provisioner' addon is enabled
🌟  The 'metrics-server' addon is enabled
Replacing env to './user-tools-operator/helm-charts/usertools/templates/statefulset.yaml.tpl' into './user-tools-operator/helm-charts/usertools/templates/statefulset.yaml'
Replacing env to './helm/science-toolkit/values.yaml.tpl' into './helm/science-toolkit/values.yaml'
"stable" has been added to your repositories
📚️ Create Namespace if not exist...

W0810 11:24:32.286701  726844 helpers.go:535] --dry-run is deprecated and can be replaced with --dry-run=client.
namespace/toolkit created
📦 Applying helm chart...

Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "jfelten" chart repository
...Successfully got an update from the "rimusz" chart repository
...Successfully got an update from the "science-toolkit" chart repository
...Successfully got an update from the "influxdata" chart repository
...Successfully got an update from the "aws" chart repository
...Successfully got an update from the "konstellation-ce" chart repository
...Successfully got an update from the "jetstack" chart repository
...Successfully got an update from the "konstellation-io" chart repository
...Successfully got an update from the "gitlab" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈Happy Helming!⎈
Saving 1 charts
Downloading minio from repo https://kubernetes-charts.storage.googleapis.com
Deleting outdated charts
Release "toolkit" does not exist. Installing it now.
NAME: toolkit
LAST DEPLOYED: Mon Aug 10 11:24:37 2020
NAMESPACE: toolkit
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
----

🌠 Konstellation Science Toolkit Installed
##############################

Your release is named toolkit.

Now open your browser at: 🌎 http://app.toolkit.172.17.0.3.nip.io

Thank you for installing SCIENCE-TOOLKIT.

----

✔️  Done.

```

Once that the Science Toolkit is deployed in our local machine on top of Minikue we have to login and start de `Users Toolks` in order to download all the Docker images required to perform trainings and write experiments. When the Users Tooll are up and running run the script `./scripts/export_images.sh`. This script will create a folder called `toolkit_images` where will export all the docker images as `.tgz` files and will create a `.tar.gz` with all the images.

```bash
cd scripts/
./export_images.sh
⏳ Check if local Minikube environment is running Science Toolkit...
✔ Done
⏳ Getting images to be exported...
✔ Done
⏳ Creating export folder and cleaning if present...
✔ Done
⏳ Exporting Science Toolkit Docker images...
0: Exporting Docker image drone/drone:1.7.0 ...
1: Exporting Docker image drone/kubernetes-secrets:latest ...
2: Exporting Docker image minio/minio:RELEASE.2019-08-07T01-59-21Z ...
3: Exporting Docker image postgres:12.1 ...
4: Exporting Docker image terminus7/drone-runner-kube:latest ...
5: Exporting Docker image terminus7/gitea:oauth ...
6: Exporting Docker image terminus7/gitea-oauth2-setup:latest ...
7: Exporting Docker image terminus7/jupyterlab-gpu:2.2.15 ...
8: Exporting Docker image terminus7/mlflow:latest ...
9: Exporting Docker image terminus7/oauth2-proxy:latest ...
10: Exporting Docker image terminus7/sci-toolkit-dashboard:latest ...
11: Exporting Docker image terminus7/sci-toolkit-user-tools-operator:latest ...
12: Exporting Docker image terminus7/sci-toolkit-vscode:1.4.6 ...
✔ Done
⏳ Creating export tar.gz file...
tar: Removing leading `/' from member names
/github/science-toolkit/scripts/toolkit_images/
/github/science-toolkit/scripts/toolkit_images/terminus7-drone-runner-kube:latest.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-gitea:oauth.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-sci-toolkit-user-tools-operator:latest.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-sci-toolkit-dashboard:latest.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-gitea-oauth2-setup:latest.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-sci-toolkit-vscode:1.4.6.gz
/github/science-toolkit/scripts/toolkit_images/drone-drone:1.7.0.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-oauth2-proxy:latest.gz
/github/science-toolkit/scripts/toolkit_images/drone-kubernetes-secrets:latest.gz
/github/science-toolkit/scripts/toolkit_images/minio-minio:RELEASE.2019-08-07T01-59-21Z.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-mlflow:latest.gz
/github/science-toolkit/scripts/toolkit_images/terminus7-jupyterlab-gpu:2.2.15.gz
/github/science-toolkit/scripts/toolkit_images/postgres:12.1.gz
✔ Done
```

## How to import the Docker images in each Kubernetes host

In order to import all the previously exported Docker images just follow the below steps.

```bash
tar zxvf toolkit_images.tar.gz
cd toolkit_images/
# the next command is just for one images, repeat it for each image
docker import terminus7-gitea-oauth2-setup:latest.gz terminus7/gitea-oauth2-setup:latest
[...]
```
