apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: {{ include "user-tools.fullname" . }}
  labels:
{{ include "user-tools.labels" . | indent 4 }}
spec:
  serviceName: {{ include "user-tools.fullname" . }}
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ include "user-tools.name" . }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ include "user-tools.name" . }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app: user-tools-{{ .Values.usernameSlug }}
    spec:
      initContainers:
        - name: codeserver-gitea-oauth2-setup
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
                name: codeserver-oauth2-secrets-{{ .Values.usernameSlug }}
            - configMapRef:
                name: gitea-configmap
        - name: jupyter-gitea-oauth2-setup
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
                name: jupyter-oauth2-secrets-{{ .Values.usernameSlug }}
            - configMapRef:
                name: gitea-configmap
      containers:
        - name: {{ .Chart.Name }}-vscode
          image: terminus7/sci-toolkit-vscode:${VSCODE_TAG}
          imagePullPolicy: IfNotPresent
          volumeMounts:
            - name: user-pvc
              mountPath: /home/coder
          {{- if .Values.sharedVolume.name }}
            - name: {{ .Values.sharedVolume.name }}
              mountPath: /home/coder/shared-storage
          {{- end }}
        - name: {{ .Chart.Name }}-jupyter
          image: terminus7/jupyterlab-gpu:${JUPYTERLAB_GPU_IMAGE_TAG}
          imagePullPolicy: IfNotPresent
          env:
            - name: JUPYTER_ENABLE_LAB
              value: "yes"
          args:
            - "start-notebook.sh"
            - "--LabApp.token=''"
          volumeMounts:
            - name: user-pvc
              mountPath: /home/jovyan
          {{- if .Values.sharedVolume.name }}
            - name: {{ .Values.sharedVolume.name }}
              mountPath: /home/jovyan/shared-storage
          {{- end }}
        - name: {{ .Chart.Name }}-vscode-proxy
          image: terminus7/oauth2-proxy:latest
          imagePullPolicy: IfNotPresent
          args:
            - "-config"
            - "/etc/oauth2_proxy.cfg"
            - "-email-domain"
            - "*"
            - "-redirect-url"
            - "https://{{ .Values.usernameSlug }}-code.{{ .Values.domain }}/oauth2/callback"
            - "-upstream"
            - "http://127.0.0.1:8080/"
            - "-pass-user-headers"
            - "-set-xauthrequest"
            - "-skip-provider-button"
          env:
            - name: OAUTH2_PROXY_GITEA_USER
              value: "{{ .Values.username }}"
            - name: OAUTH2_PROXY_HTTP_ADDRESS
              value: "0.0.0.0:4180"
            - name: OAUTH2_PROXY_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: codeserver-oauth2-secrets-{{ .Values.usernameSlug }}
                  key: CODESERVER_OAUTH2_CLIENT_ID
            - name: OAUTH2_PROXY_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: codeserver-oauth2-secrets-{{ .Values.usernameSlug }}
                  key: CODESERVER_OAUTH2_CLIENT_SECRET
          volumeMounts:
            - name: oauth2-config
              mountPath: /etc/oauth2_proxy.cfg
              subPath: oauth2_proxy.cfg
          ports:
            - name: http
              containerPort: 4180
              protocol: TCP
        - name: {{ .Chart.Name }}-jupyter-proxy
          image: terminus7/oauth2-proxy:latest
          imagePullPolicy: IfNotPresent
          args:
            - "-config"
            - "/etc/oauth2_proxy.cfg"
            - "-email-domain"
            - "*"
            - "-redirect-url"
            - "https://{{ .Values.usernameSlug }}-jupyter.{{ .Values.domain }}/oauth2/callback"
            - "-upstream"
            - "http://127.0.0.1:8888/"
            - "-pass-user-headers"
            - "-set-xauthrequest"
            - "-skip-provider-button"
            - "-http-address"
            - "0.0.0.0:4181"
          env:
            - name: OAUTH2_PROXY_GITEA_USER
              value: "{{ .Values.username }}"
            - name: OAUTH2_PROXY_HTTP_ADDRESS
              value: "0.0.0.0:4181"
            - name: OAUTH2_PROXY_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: jupyter-oauth2-secrets-{{ .Values.usernameSlug }}
                  key: JUPYTER_OAUTH2_CLIENT_ID
            - name: OAUTH2_PROXY_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: jupyter-oauth2-secrets-{{ .Values.usernameSlug }}
                  key: JUPYTER_OAUTH2_CLIENT_SECRET
          volumeMounts:
            - name: oauth2-config
              mountPath: /etc/oauth2_proxy.cfg
              subPath: oauth2_proxy.cfg
          ports:
            - name: http
              containerPort: 4181
              protocol: TCP
      volumes:
        - name: oauth2-config
          configMap:
            name: {{ include "user-tools.fullname" . }}-oauth2-proxy
        {{ if .Values.sharedVolume.name -}}
        - name: {{ .Values.sharedVolume.name }}
          persistentVolumeClaim:
            claimName: {{ .Values.sharedVolume.name }}-claim
        {{- end }}
  volumeClaimTemplates:
    - metadata:
        name: user-pvc
        labels:
          app: user
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: {{ .Values.storage.className }}
        resources:
          requests:
            storage:  {{ .Values.storage.size }}
