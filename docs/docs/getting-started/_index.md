---
title: "Getting Started"
linkTitle: "Getting Started"
weight: 2
description: >
  What does your user need to know to try your project?
---

## Pre-requisites

In order to install Science Toolkit needs the following tools:

- Helm version 3. [+ info](https://helm.sh/) (works also with v2)
- A Kubernetes cluster (tested only with 1.15.4) [+ info](https://kubernetes.io/es/)
  - You can also use a local cluster like [minikube](https://kubernetes.io/docs/setup/learning-environment/minikube/).


## Add helm dependencies repos

```bash
$ helm repo add stable https://kubernetes-charts.storage.googleapis.com
$ helm repo add jupyterhub https://jupyterhub.github.io/helm-chart/
$ helm repo add science-toolkit https://intelygenz.github.io/science-toolkit/helm-chart/
$ helm dep update helm/science-toolkit-lite
```


## Setting up chart values

- Fill values needed to install science toolkit chart:

| Parameter                        | Description                                                     | Default         |
| -------------------------------- | --------------------------------------------------------------- | --------------- |
| `domain`                         | This is the base DNS name for all the components in the toolkit | `toolkit.local` |
| `sharedVolume.storageClassName`  | The Kubernetes Storage Class Name where to create the volume    | `standard`      |
| `gitea.volume.storageClassName`  | The Kubernetes Storage Class Name where to create the volume    | `standard`      |
| `drone.volume.storageClassName`  | The Kubernetes Storage Class Name where to create the volume    | `standard`      |
| `vscode.volume.size`             | Size for the vscode config volume                               | `10Gi`          |
| `vscode.volume.storageClassName` | The Kubernetes Storage Class Name where to create the volume    | `standard`      |


## Installation


```bash
$ helm repo update
$ helm upgrade \
  --wait \
  --install science-toolkit \
  --namespace science-toolkit \
  --values values.yaml \
  --timeout 5m \
  science-toolkit/science-toolkit
```


### Domain Setup

If you are deploying Science Toolkit in a remote cluster you need setup a DNS helm param on `values.yaml` file