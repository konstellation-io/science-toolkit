domain: toolkit.local

sharedVolume:
  name: received-data
  storageClassName: standard
  size: 10Gi
  path: /sci-toolkit/received-data

dashboard:
  image:
    repository: terminus7/sci-toolkit-dashboard
    tag: ${DASHBOARD_TAG}
    pullPolicy: IfNotPresent

gitea:
  admin:
    username: ${GITEA_ADMIN_USER}
    password: "${GITEA_ADMIN_PASSWORD}"
    email: test@test.com
  image:
    repository: terminus7/gitea
    tag: oauth
    pullPolicy: IfNotPresent
  storage:
    size: 10Gi
    storageClassName: standard

giteaOauth2Setup:
  image:
    tag: ${GITEA_OAUTH2_SETUP_TAG}

userToolsOperator:
  image:
    tag: ${USER_TOOLS_OPERATOR_TAG}

oauth2Proxy:
  image:
    # using latest because this is not generated on this monorepo.
    tag: latest

postgres:
  dbName: gitea
  dbPassword: test
  storage:
    size: 10Gi
    storageClassName: standard

drone:
  image:
    repository: drone/drone
    tag: 1.7.0
    pullPolicy: IfNotPresent
  storage:
    size: 10Gi
    storageClassName: standard
  rpcSecret: runner-shared-secret

droneRunner:
  image:
    repository: terminus7/drone-runner-kube
    tag: latest
    pullPolicy: IfNotPresent
  namespace: sci-toolkit

vscode:
  storage:
    size: 10Gi
    storageClassName: standard

minio:
  accessKey: minio
  secretKey: minio123
  persistence:
    storageClass: standard
    existingClaim: received-data-claim
    accessMode: ReadWriteMany
  ingress:
    enabled: true
    hosts:
      - minio.local
    annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: "1000000m"

mlflow:
  name: mlflow-server
  image: 
    repository: terminus7/mlflow
    tag: ${MLFLOW_TAG}
    pullPolicy: IfNotPresent
  host: mlflow
  volume:
    size: 10Gi
    storageClassName: standard
  s3:
    bucket: mlflow-artifacts

<<<<<<< HEAD
backup:
  gitea:
    enabled: false
    schedule: "0 1 * * 0" # every sunday at 1:00 AM
  s3:
    awsAccessKeyID: yourawskeyid
    awsSecretAccessKey: yourawssecretkey
    bucketName: yourS3BackupBucketName

cleaner:
  enabled: false
  schedule: "0 1 * * 0" # every sunday at 1:00 AM
  trashPath: /shared-storage/.trash
  threshold: 5 # minimun age of files to be removed

=======
>>>>>>> WIP: tls self-signed-cert
tls:
  enable: false
  certManager: false
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: user@email.com