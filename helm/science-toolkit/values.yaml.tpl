domain: toolkit.local

autologin:
  username: test
  password: test123
  image:
    repository: terminus7/sci-toolkit-autologin
    tag: ${AUTOLOGIN_TAG}
    pullPolicy: IfNotPresent

gitea:
  username: test
  password: Test.123
  image:
    repository: gitea/gitea
    tag: 1.10.0
    pullPolicy: IfNotPresent
  storage:
    size: 10Gi
    storageClassName: standard
  oauth2:
    clientID: Y2hhbmdlLWNsaWVudC1pZA==
    secret: Y2hhbmdlLXNlY3JldA==

postgres:
  dbName: gitea
  dbPassword: test
  storage:
    size: 10Gi
    storageClassName: standard

drone:
  image:
    repository: drone/drone
    tag: 1.6.2
    pullPolicy: IfNotPresent
  storage:
    size: 10Gi
    storageClassName: standard
  rpcSecret: runner-shared-secret

droneRunner:
  image:
    repository: drone/drone-runner-kube
    tag: latest
    pullPolicy: IfNotPresent
  namespace: sci-toolkit

sharedVolume:
  name: received-data
  storageClassName: standard
  path: /sci-toolkit/received-data

vscode:
  image:
    repository: terminus7/sci-toolkit-vscode
    tag: ${VSCODE_TAG}
    pullPolicy: IfNotPresent
  password: "123456"
  storage:
    size: 10Gi
    storageClassName: standard

jupyterhub:
  credentials:
    username: test
    password: test
  hub:
    cookieSecret: "61cffae7cfa30a05086fd916ec27f06b1388ada9302356c090c735b00082ad4a"
    extraConfig: |-
      c.Spawner.ip = '0.0.0.0'
      c.Spawner.cmd = ['jupyter-labhub']
  proxy:
    secretToken: "3bcee88b0a1aea302b9757fd9dcc8579469f86bac91229ee5dd0262f4b3d274d"
    service:
      type: ClusterIP
  cull:
    timeout: 259200
  ingress:
    enabled: false
  singleuser:
    defaultUrl: "/lab"
    cloudMetadata:
      enabled: true
    image:
      name: terminus7/jupyterlab-gpu
      tag: 1.4.0-test
    storage:
      extraVolumes:
        - name: received-data
          persistentVolumeClaim:
            claimName: received-data-claim
      extraVolumeMounts:
        - mountPath: /home/jovyan/projects
          name: received-data

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
