domain: toolkit-lite.konstellation.io

sharedVolume:
  name: received-data-toolkit-lite
  storageClassName: microk8s-hostpath
  path: /sci-toolkit-lite/received-data-toolkit-lite
  size: 100Gi

jupyterhub:
  singleuser:
    storage:
      capacity: 10Gi
      extraVolumes:
        - name: received-data-toolkit-lite
          persistentVolumeClaim:
            claimName: received-data-toolkit-lite-claim
      extraVolumeMounts:
        - mountPath: /home/jovyan/projects
          name: received-data-toolkit-lite

minio:
  persistence:
    storageClass: standard
    existingClaim: received-data-toolkit-lite-claim
    accessMode: ReadWriteMany

mlflow:
  name: mlflow-tracking-server
  image: 
    repository: terminus7/mlflow
    tag: 1.0.0
    pullPolicy: IfNotPresent
  service:
    port: 5000
  host: mlflow
  volume:
    size: 10Gi
  s3: 
    bucket: mlflow-artifacts
