domain: toolkit.konstellation.io

gitea:
  storage:
    size: 10Gi
    storageClassName: microk8s-hostpath
  oauth2:
    clientID: ${GITEA_CLIENT_ID}
    secret: ${GITEA_SECRET}

postgres:
  storage:
    size: 10Gi
    storageClassName: microk8s-hostpath

drone:
  storage:
    size: 10Gi
    storageClassName: microk8s-hostpath

vscode:
  storage:
    size: 10Gi
    storageClassName: microk8s-hostpath

jupyterhub:
  singleuser:
    storage:
      extraVolumes:
        - name: received-data-toolkit
          persistentVolumeClaim:
            claimName: received-data-toolkit-claim
      extraVolumeMounts:
        - mountPath: /home/jovyan/projects
          name: received-data-toolkit

minio:
  persistence:
    storageClass: standard
    existingClaim: received-data-toolkit-claim
    accessMode: ReadWriteMany

sharedVolume:
  name: received-data-toolkit
  storageClassName: microk8s-hostpath
  path: /sci-toolkit/received-data-toolkit