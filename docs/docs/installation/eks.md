---
title: "Installation on EKS"
linkTitle: "Installation on EKS"
weight: 50
description: >
  How to start the Science Toolkit on an AWS EKS cluster
---


# Pre-requisites


## AWS Infrastructure Size

- The Science Toolkit needs around 14 IPs for all the pods/services. You need large enough machines to allocate all those IPs, you have the information [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html#AvailableIpPerENI).
- Recommendations: At least `2 x t3.large`

## Storage Provisioner

It's necessary to have a shared storage. The Toolkit is tested with [EFS storage](https://aws.amazon.com/es/efs/)  that it needs to be added to your EKS cluster.
```bash
helm upgrade --install --set efsProvisioner.efsFileSystemId=$AWS_EFS_ID
      --set efsProvisioner.awsRegion=$AWS_DEFAULT_REGION --set efsProvisioner.storageClass.name=standard
      efs-provisioner  stable/efs-provisioner
```

If you want a different sharing approach you can create it on your cluster and then setup the storage class name on the helm `values.yml` file.

If don't have the EFS provisioner already installed, you can follow [this guide](https://github.com/kubernetes-incubator/external-storage/tree/master/aws/efs).



## DNS configuration

To access the Science Toolkit you will need one CNAME record with a wildcard connecting to your EKS load balancer. 
 
In order to get the load balancer hostname run this command:
```bash
 kubectl get services nginx-ingress-controller -n kube-system -o wide
NAME                       TYPE           CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)                      AGE     SELECTOR
nginx-ingress-controller   LoadBalancer   10.100.147.xxx   a92e831a9825e4751ae71e1aa919965e-xxxxxxxx.us-east-1.elb.amazonaws.com   80:31560/TCP,443:31065/TCP   3d19h   app.kubernetes.io/component=controller,app=nginx-ingress,release=nginx-ingress
```

Add the CNAME wildcard entry like this.

```bash
*.toolkit.<Your domain>         CNAME       a92e831a9825e4751ae71e1aa919965e-xxxxxxxx.us-east-1.elb.amazonaws.com
```

## Tools Requirements

- `kubectl` and `helm` installed on your system
- [Install AWS IAM Authenticator](https://docs.aws.amazon.com/eks/latest/userguide/install-aws-iam-authenticator.html)
- [Set your AWS Credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- Copy your kubeconfig to ./kube dir
  ```
   mkdir -p $HOME/.kube
   cp ./kubeconfig $HOME/.kube
  ```
- Now you can access to the cluster, if the command `kubectl get nodes` return a node list, all is ok.


# Installation steps


### Add helm repo 

```bash
helm repo add science-toolkit https://intelygenz.github.io/science-toolkit/helm-chart/ 
helm repo update
```


### Setup storage class

You can show the actual values with this command:

```bash
helm show values science-toolkit/science-toolkit 
```

If you have a storage class different from `standard`, you will need to create a `values.yaml` and set the value `storageClassName` on all components.


### Install

If you are using all the default values run:

```bash
# Create the namespace
kubectl create ns science-toolkit --dry-run -o yaml | kubectl apply -f -

# Install the chart
helm upgrade \
  --wait \
  --install science-toolkit \
  --namespace science-toolkit \
  --timeout 20m \
  science-toolkit/science-toolkit
```

If you have custom values add `--values my_values.yaml`.


# Checking installation

`kubectl get pods -n science-toolkit`
```bash
NAME                                     READY   STATUS    RESTARTS   AGE
dashboard-7f9f988644-r9drx               2/2     Running   0          3d18h
drone-0                                  1/1     Running   0          3d18h
drone-runner-5ddc7b4bb8-7m6qc            1/1     Running   0          3d18h
gitea-0                                  1/1     Running   1          3d18h
hub-7bd8b55c5-vshkc                      1/1     Running   0          3d18h
mlflow-server-74b4b85bbb-bgqlg           2/2     Running   0          3d18h
postgres-0                               1/1     Running   0          3d18h
proxy-f95bff87b-nnkpd                    1/1     Running   0          3d18h
science-toolkit-minio-59b987965c-zc8dr   1/1     Running   0          3d18h
user-scheduler-795cbb6486-9c94w          1/1     Running   0          3d18h
user-scheduler-795cbb6486-pvqkv          1/1     Running   0          3d18h
user-tools-operator-54d5c79c65-qhvws     1/1     Running   0          3d18h
```