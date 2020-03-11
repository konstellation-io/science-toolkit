domain: toolkit.local

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
  storage:
    size: 10Gi
    storageClassName: standard

jupyterhub:
  credentials:
    username: test
    password: test
  hub:
    initContainers:
      - name: gitea-oauth2-setup
        image: terminus7/gitea-oauth2-setup:${GITEA_OAUTH2_SETUP_TAG}
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
              name: jupyter-oauth2-secrets
          - configMapRef:
              name: gitea-configmap
    cookieSecret: "61cffae7cfa30a05086fd916ec27f06b1388ada9302356c090c735b00082ad4a"
    extraEnv:
      - name: OAUTH2_AUTHORIZE_URL
        valueFrom:
          configMapKeyRef:
            name: gitea-configmap
            key: GITEA_OAUTH2_AUTHORIZE_URL
      - name: OAUTH2_TOKEN_URL
        valueFrom:
          configMapKeyRef:
            name: gitea-configmap
            key: GITEA_OAUTH2_TOKEN_URL
      - name: OAUTH2_USERDATA_URL
        valueFrom:
          configMapKeyRef:
            name: gitea-configmap
            key: GITEA_OAUTH2_USERDATA_URL
      - name: OAUTH_CALLBACK_URL
        valueFrom:
          secretKeyRef:
            name: jupyter-oauth2-secrets
            key: JUPYTER_OAUTH2_CALLBACK_URL
      - name: OAUTH_CLIENT_ID
        valueFrom:
          secretKeyRef:
            name: jupyter-oauth2-secrets
            key: JUPYTER_OAUTH2_CLIENT_ID
      - name: OAUTH_CLIENT_SECRET
        valueFrom:
          secretKeyRef:
            name: jupyter-oauth2-secrets
            key: JUPYTER_OAUTH2_CLIENT_SECRET
      - name: GITEA_REDIRECT_URIS
        valueFrom:
          secretKeyRef:
            name: jupyter-oauth2-secrets
            key: GITEA_REDIRECT_URIS
    db:
      type: postgres
      url: postgres+psycopg2://postgres:test@postgres:5432/hub
      pvc:
        storageClassName: standard
    extraConfig:
      myConfig: |
        c.Spawner.ip = '0.0.0.0'
        c.Spawner.cmd = ['jupyter-labhub']
        c.JupyterHub.authenticator_class = 'oauthenticator.generic.GenericOAuthenticator'
        c.GenericOAuthenticator.login_service = 'Gitea'
        
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
      capacity: 10Gi
      dynamic:
        storageClass: standard
      extraVolumes:
        - name: received-data
          persistentVolumeClaim:
            claimName: received-data-claim
        - name: minio-config
          configMap:
            name: minio-config
      extraVolumeMounts:
        - name: received-data
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
              cp /tmp/config.json /home/jovyan/.mc/config.json

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
  service:
    port: 8080
  host: mlflow
  volume:
    size: 10Gi
  s3: 
    bucket: mlflow-artifacts
