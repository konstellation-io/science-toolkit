# Science Toolkit Chart

This folder hold the Helm code to deploy the Science Toolkit on top of a Kubernetes cluster.

## Development

In order check the chart definition run the following command.

```bash
helm dependencies update ./science-toolkit
helm upgrade --install  debug  --namespace sci-toolkit --dry-run --debug helm/science-toolkit  > debug.yml
```
With the above command you can check the helm/debug.yml content and check how each kubernetes yaml definition have been fulfill by helm.

## Deploy on Kinikube

```bash
minikube -p sci-toolkit start --kubernetes-version=1.15.6
helm init
kubectl create ns sci-toolkit
helm dependencies update ./science-toolkit
helm upgrade --install sci-toolkit --namespace sci-toolkit ./science-toolkit
```

## Configuration

### Common

| Parameter | Description                                                     | Default         |
| --------- | --------------------------------------------------------------- | --------------- |
| `domain`  | This is the base DNS name for all the components in the toolkit | `toolkit.local` |

### Gitea

| Parameter                       | Description                                                | Default        |
| ------------------------------- | ---------------------------------------------------------- | -------------- |
| `gitea.image.repository`        | This is the Gitea Docker image                             | `gitea/gitea`  |
| `gitea.image.tag`               | This is the version of the Gitea Docker image              | `1.10.0`       |
| `gitea.image.pullPolicy`        | Policy of download Docker image in Kubernetes              | `IfNotPresent` |
| `gitea.service.port`            | Port of internal gitea service                             | `3000`         |
| `gitea.volume.size`             | Size for the Gitea config volume                           | `10Gi`         |
| `gitea.volume.storageClassName` | The Kubernetes Storage Class Name whe to create the volume | `standard`     |
| `postgres.dbName`               | Name of the db to persiste Gitea config                    | `gitea`        |
| `postgres.dbPassword`           | Set the password for postgres user                         | `test`         |

### Drone

| Parameter                       | Description                                                                   | Default                   |
| ------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| `drone.image.repository`        | This is the Drone Docker image                                                | `drone/drone`             |
| `drone.image.tag`               | This is the version of the Drone Docker image                                 | `1.10.0`                  |
| `drone.image.pullPolicy`        | Policy of download Docker image in Kubernetes                                 | `IfNotPresent`            |
| `drone.service.port`            | Port of internal drone service                                                | `80`                      |
| `drone.volume.size`             | Size for the drone config volume                                              | `10Gi`                    |
| `drone.volume.storageClassName` | The Kubernetes Storage Class Name whe to create the volume                    | `standard`                |
| `drone.rpcSecret`               | Shared secret to authorize runners                                            | `runner-shared-secret`    |
| `drone-runner.image.repository` | This is the drone-runner Docker image                                         | `drone/drone-runner-kube` |
| `drone-runner.image.tag`        | This is the version of the drone-runner Docker image                          | `latest`                  |
| `drone-runner.image.pullPolicy` | Policy of download Docker image in Kubernetes                                 | `IfNotPresent`            |
| `drone-runner.namespace`        | This is the Kuberentes namespace where the pods are going to run on each task | `sci-toolkit              |


### VSCode

| Parameter                        | Description                                                | Default    |
| -------------------------------- | ---------------------------------------------------------- | ---------- |
| `vscode.password`                | Default password for vscode                                | `123456`   |
| `vscode.volume.size`             | Size for the vscode config volume                          | `10Gi`     |
| `vscode.volume.storageClassName` | The Kubernetes Storage Class Name whe to create the volume | `standard` |
