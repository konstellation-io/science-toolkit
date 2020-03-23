# Gitea Oauth2 Setup

This Docker image has been intended to run as an initContainer within a Kubernetes pod. In the start up this container conecto to Gitea server and create an Oauth2 Application api keys.

This is a component of a toolkit that is compound for a group of pieces in order to allow a workflow for data scientists. For more details check out the [Science Toolkit documentation](https://intelygenz.github.io/science-toolkit/)


## Run

Below is an example of how to add the initContainer within a deployment in Kubernetes.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      initContainers:
        - name: gitea-oauth2-setup
          image: terminus7/gitea-oauth2-setup:latest
          imagePullPolicy: IfNotPresent
          env:
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          envFrom:
            - secretRef:
                name: gitea-admin-secrets
            - secretRef:
                name: my-app-oauth2-secrets
            - configMapRef:
                name: gitea-configmap
            - configMapRef:
                name: my-app-configmap
      containers:
        - name: my-app
[...]
```

## Configuration

| Environment variable        | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| GITEA_INIT_TIMEOUT          | Timeout to wait till Gitea server is ready |
| GITEA_REDIRECT_URIS         | Callback URL of our application | 
| GITEA_URL                   | The URL of the Gitea server |
| GITEA_ADMIN_USER            | Admin account of Gitea with permissions to create Oauth2 Applications |
| GITEA_ADMIN_PASSWORD        | Password for the admin user |
| GITEA_APPLICATION_NAME      | Name of the Oauth2 Application, used to call the keys in Gitea |
| DEPLOYMENT_SECRET_NAME      | Name where the Kubernetes secrets are defined |
| OAUTH2_CREDENTIALS_PREFIX   | In order to allow define all the components secrets within the same Kuberentes object is required a prefix to define which component is each config |
| POD_NAMESPACE               | This value is taken from Kubernetes metadata |
