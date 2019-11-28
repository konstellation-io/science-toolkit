# Science Toolkit Chart

This folder hold the Helm code to deploy the Science Toolkit on top of a Kubernetes cluster.

## Development

In order check the chart definition run the following command.

```bash
helm upgrade --install  debug  --namespace sci-toolkit --dry-run --debug helm/science-toolkit  > debug.yml
```
With the above command you can check the helm/debug.yml content and check how each kubernetes yaml definition have been fulfill by helm.

## Deploy on Kinikube

```bash
minikube -p sci-toolkit start --kubernetes-version=1.15.6
helm init
kubectl create ns sci-toolkit
helm upgrade --install sci-toolkit --namespace sci-toolkit ./science-toolkit
```

## Configuration

### Gitea

Parameter | Description | Default
--------- | ----------- | -------
`gitea.image.repository` | This is the Gitea Docker image | `gitea/gitea`
`gitea.image.tag` | This is the version of the Gitea Docker image | `1.10.0`
`gitea.image.pullPolicy` | Policy of download Docker image in Kubernetes | `IfNotPresent`
`gitea.service.port` | Port of internal gitea service | `3000`
`gitea.host` | This is the name to be expose as a Kubernetes ingress | `gitea.local`
`gitea.volume.size` | Size for the Gitea config volume | `10Gi`
`gitea.volume.storageClassName` | The Kubernetes Storage Class Name whe to create the volume | `standard`
`postgres.dbName` | Name of the db to persiste Gitea config | `gitea`
`postgres.dbPassword` | Set the password for postgres user | `test`
