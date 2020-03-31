---
title: "Installation on Minikube"
linkTitle: "Installation on Minikube"
weight: 40
description: >
  How to start the Science Toolkit on a Minikube cluster
---

# Pre-requisites

 * A Minikube installation. If you need help installing it follow [this guide](https://kubernetes.io/docs/tasks/tools/install-minikube/)
 * A Helm installation. You can install it following [this guide](https://helm.sh/docs/intro/install/)

 * A bash console able execute `.sh` scripts
 * `gettext` package installed
 *  A clone of this repo


# Checking requisites

If you have all the pre-requisites you should be able to execute all these commands without errors:

```
$> minikube version
$> helm version
$> kubectl version
```

# Installation steps


### Clone the repo
```
$> git clone git@github.com:intelygenz/science-toolkit.git
```

### Create the local environment

To start the installation you can use the script `<repo_root>/local_env.sh`. This script will take care of the following steps:

- start a Minikube profile named `toolkit` with this features (*):
  - 4 Gb of RAM
  - 4 CPUs
  - 40 Gb of disk
  - Kubernetes installation v1.15.4
- setup helm dependencies needed by the science-toolkit chart
- deploy a helm release on `toolkit` namespace
- show information on how to access it


(*) You can change these features to your needs by editing `scripts/minikube_start.sh`


The output should look like:

```
  🙄  [toolkit] minikube v1.7.2 on Ubuntu 19.04
      ▪ MINIKUBE_PROFILE=toolkit
  ✨  Using the virtualbox driver based on existing profile
  👍  Kubernetes 1.17.2 is now available. If you would like to upgrade, specify: --kubernetes-version=1.17.2
  ⌛  Reconfiguring existing host ...
  🔄  Starting existing virtualbox VM for "toolkit" ...
  🐳  Preparing Kubernetes v1.15.4 on Docker 19.03.5 ...
      ▪ apiserver.authorization-mode=RBAC
  🚀  Launching Kubernetes ...
  🌟  Enabling addons: dashboard, default-storageclass, ingress, metrics-server, registry, storage-provisioner
  🏄  Done! kubectl is now configured to use "toolkit"
  ⚠️  /snap/bin/kubectl is version 1.17.3, and is incompatible with Kubernetes 1.15.4. You will need to update /snap/bin/kubectl or use 'minikube kubectl' to connect with this cluster
  🌟  The 'ingress' addon is enabled
  🌟  The 'dashboard' addon is enabled
  🌟  The 'registry' addon is enabled
  🌟  The 'storage-provisioner' addon is enabled
  🌟  The 'metrics-server' addon is enabled
  Replacing env to './user-tools-operator/helm-charts/usertools/templates/statefulset.yaml.tpl' into './user-tools-operator/helm-charts/usertools/templates/statefulset.yaml'
  Replacing env to './helm/science-toolkit-lite/values.yaml.tpl' into './helm/science-toolkit-lite/values.yaml'
  Replacing env to './helm/science-toolkit/values.yaml.tpl' into './helm/science-toolkit/values.yaml'
  Replacing env to './tmp/science-toolkit/values.yaml.tpl' into './tmp/science-toolkit/values.yaml'
  "stable" has been added to your repositories
  📚️ Create Namespace if not exist...

  namespace/toolkit configured
  📦 Applying helm chart...

  Hang tight while we grab the latest from your chart repositories...
  ...Successfully got an update from the "science-toolkit" chart repository
  ...Successfully got an update from the "rimusz" chart repository
  ...Successfully got an update from the "stable" chart repository
  ...Successfully got an update from the "charts.gitpod.io" chart repository
  Update Complete. ⎈Happy Helming!⎈
  Saving 2 charts
  Downloading jupyterhub from repo https://jupyterhub.github.io/helm-chart/
  Downloading minio from repo https://kubernetes-charts.storage.googleapis.com
  Deleting outdated charts
  Release "toolkit" does not exist. Installing it now.
  NAME: toolkit
  LAST DEPLOYED: Thu Mar 19 09:17:02 2020
  NAMESPACE: toolkit
  STATUS: deployed
  REVISION: 1
  TEST SUITE: None
  NOTES:
  ----

  🌠 Konstellation Science Toolkit Installed
  ##############################

  Your release is named toolkit.

  Now open your browser at: 🌎 http://app.toolkit.__YOUR_MINIKUBE_IP__.nip.io

  Thank you for installing SCIENCE-TOOLKIT.

  ----

  ✔️  Done.

```



# Checking installation

Once you installed the science toolkit chart you can access it locally in your browser.

Open the url   http://app.toolkit.$YOUR_MINIKUBE_IP.nip.io

When you open it, it would  redirect you to Gitea to authenticate. The default credentials are:

- user: `toolkit-admin`
- password: `123456`


Note: Change $YOUR_MINIKUBE_IP for the actual IP of the toolkit profile of minikube. If you need to get the IP run `minikube ip -p toolkit`

