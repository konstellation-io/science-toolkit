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

### TLS 
| Parameter                     | Description                                                                            | Default                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| `tls.enabled`                 | Enable TLS to use a secure layer                                                       | `false`                                  |

If you use cert manager to generate a required certificate add this parameters
#### Cert Manager
| Parameter                     | Description                                                                            | Default                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| `tls.certManager.enabled`     | Enable Cert Manager to validate certificates                                           | `false`                                  |
| `tls.certManager.acme.server` | Default certificate authority server to validate certificates, more instructions below | `acme-v02.api.letsencrypt.org/directory` |
| `tls.certManager.acme.email`  | Default email for the certificate owner                                                | `user@email.com`                         |

You can fill in the field `certManager.acme.server` with one of the following values depend of your environment:

**Production environment**
```
  certManager:
    acme:
        server: https://acme-v02.api.letsencrypt.org/directory
```
Rate limit of 50 per day on certificates request with a week block if the limit is passed.[+ info](https://letsencrypt.org/docs/rate-limits/)

No web-browser action required.

**Staging environment** 
```
  certManager:
    acme:
        server: https://acme-staging-v02.api.letsencrypt.org/directory
```
Rate limit of 1500 each three hours on certificates request.[+ Info](https://letsencrypt.org/docs/staging-environment/)

This option needs the following action from user to set-up the staging certification authority.

#### How add the fake certificate on chrome
- Download the certificate [Fake Certificate](https://letsencrypt.org/certs/fakeleintermediatex1.pem)
- Go to settings -> Search Certificates -> Manage Certificates -> Issuers Entities
- Import the previous certificate.
- Enable the first option.
- Reload the https://app.<your-domain> page
- You have a certificate for any science-toolkit domain.

#### Route 53

Custom configuration to integrate Cert Manager with Route 53

| Parameter                                       | Description                                  | Default                                  |
| ----------------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| `tls.certManager.dns01.route53.region`          | AWS Region                                   | `your aws region`                        |
| `tls.certManager.dns01.route53.hostedZoneID`    | AWS Hosted  Zone ID                          | `your aws hosted zone`                   |
| `tls.certManager.dns01.route53.secretAccessKey` | AWS Access Key                               | `your aws access key`                    |
| `tls.certManager.dns01.route53.accessKeyID`     | AWS Access Key ID                            | `your aws access key ID`                 |                  
