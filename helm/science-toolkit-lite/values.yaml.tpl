domain: toolkit.local

sharedVolume:
  name: received-data-toolkit-lite
  storageClassName: standard
  path: /sci-toolkit-data/received-data-toolkit-lite
  size: 1Gi

jupyterhub:
  credentials:
    username: test
    password: test
  hub:
    cookieSecret: "61cffae7cfa30a05086fd916ec27f06b1388ada9302356c090c735b00082ad4a"
    extraConfig: 
      myConfig: |-
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
      tag: ${JUPYTERLAB_GPU_IMAGE_TAG}
    storage:
      capacity: 2Gi
      extraVolumes:
        - name: received-data-toolkit-lite
          persistentVolumeClaim:
            claimName: received-data-toolkit-lite-claim
        - name: minio-config
          configMap:
            name: minio-config
      extraVolumeMounts:
        - name: received-data-toolkit-lite
          mountPath: /home/jovyan/projects
        - name: minio-config
          mountPath: /tmp/config.json
          subPath: config.json
    lifecycleHooks:
      postStart:
        exec:
          command:
            - "sh"
            - "-c"
            - >
              mkdir /home/jovyan/.mc;
              cp /tmp/config.json /home/jovyan/.mc/config.json;
              chown -R jovyan /home/jovyan/.mc

minio:
  accessKey: minio
  secretKey: minio123
  persistence:
    storageClass: standard
    existingClaim: received-data-toolkit-lite-claim
    accessMode: ReadWriteMany
  ingress:
    enabled: true
    hosts:
      - minio.local
    annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: "1000000m"

mlflow:
  name: mlflow-tracking-server
  image: 
    repository: terminus7/mlflow
    tag: ${MLFLOW_TAG}
    pullPolicy: IfNotPresent
  service:
    port: 5000
  host: mlflow.local
  volume:
    size: 10Gi
  s3: 
    bucket: mlflow-artifacts
