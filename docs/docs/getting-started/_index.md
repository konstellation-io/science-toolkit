---
title: "Getting Started"
linkTitle: "Getting Started"
weight: 20
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
$ helm repo add stable https://charts.helm.sh/stable
$ helm repo add jupyterhub https://jupyterhub.github.io/helm-chart/
$ helm repo add science-toolkit https://konstellation-io.github.io/science-toolkit/helm-chart/
$ helm repo update
```


## Setting up chart values

Make a copy of [sample-values.yaml](https://github.com/konstellation-io/science-toolkit/tree/master/helm/example-values.yaml) and change what you need to deploy Science Toolkit on top of a Minikube local environment.

Basically you need to set some credentials for different components. Only change your storage class name if your cluster have something different from `standard`.


## Installation

```bash
$ helm upgrade \
  --wait \
  --install science-toolkit \
  --namespace science-toolkit \
  --values values.yaml \
  --timeout 5m \
  science-toolkit/science-toolkit
```


### Domain Setup

If you are deploying Science Toolkit in a remote cluster you need setup a DNS subdomain pointint to the ip address
where your ingress controller is listening, and set this domain in the `values.yaml` file before deploy it.


