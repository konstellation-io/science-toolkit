{{ if .Capabilities.APIVersions.Has "apps/v1" }}
apiVersion: apps/v1
{{ else if .Capabilities.APIVersions.Has "apps/v1beta1" }}
apiVersion: apps/v1beta1
{{ end }}
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
      {{- if .Values.kdl.enabled }}
        - name: {{ .Chart.Name }}-repo-cloner
          image: konstellation/user-repo-cloner:latest
          imagePullPolicy: IfNotPresent
          env:
            - name: KDL_USER_NAME
              value: "{{ .Values.username }}"
          envFrom:
          - secretRef:
              name: tools-secret
          - secretRef:
              name: kdl-server-secrets
          volumeMounts:
            - name: user-pvc
              mountPath: /home/kdl
            - name: {{ .Values.username }}-ssh-keys
              mountPath: /home/kdl/.ssh/
              readOnly: true
      {{- end }}
        - name: {{ .Chart.Name }}-vscode
          image: terminus7/sci-toolkit-vscode:${VSCODE_TAG}
          imagePullPolicy: IfNotPresent
          envFrom:
          - secretRef:
              name: tools-secret
          volumeMounts:
            - name: user-pvc
              mountPath: /home/coder
          {{- if .Values.sharedVolume.name }}
            - name: {{ .Values.sharedVolume.name }}
              mountPath: /home/coder/shared-storage
          {{- end }}
          {{- if .Values.kdl.enabled }}
            - name: {{ .Values.username }}-ssh-keys
              mountPath: /home/coder/.ssh/
              readOnly: true
          {{- end }}
        - name: {{ .Chart.Name }}-jupyter
          image: terminus7/jupyterlab-gpu:${JUPYTERLAB_GPU_IMAGE_TAG}
          imagePullPolicy: IfNotPresent
          envFrom:
          - secretRef:
              name: tools-secret
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
          {{- if .Values.kdl.enabled }}
            - name: {{ .Values.username }}-ssh-keys
              mountPath: /home/jovyan/.ssh/
              readOnly: true
          {{- end }}
        - name: {{ .Chart.Name }}-vscode-proxy
          image: {{ .Values.oauth2Proxy.image.repository }}:{{ .Values.oauth2Proxy.image.tag }}
          imagePullPolicy: {{ .Values.oauth2Proxy.image.pullPolicy }}
          args:
            - "--config=/etc/oauth2_proxy.cfg"
            - "--email-domain=*"
            - "--redirect-url={{ printf "%s://%s-code.%s/oauth2/callback" ( include "protocol" . ) .Values.usernameSlug .Values.domain }}"
            - "--upstream=http://127.0.0.1:8080/"
            - "--pass-user-headers=true"
            - "--set-xauthrequest=true"
            - "--skip-provider-button=true"
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
          image: {{ .Values.oauth2Proxy.image.repository }}:{{ .Values.oauth2Proxy.image.tag }}
          imagePullPolicy: {{ .Values.oauth2Proxy.image.pullPolicy }}
          args:
            - "--config=/etc/oauth2_proxy.cfg"
            - "--email-domain=*"
            - "--redirect-url={{ printf "%s://%s-jupyter.%s/oauth2/callback" ( include "protocol" . ) .Values.usernameSlug .Values.domain }}"
            - "--upstream=http://127.0.0.1:8888/"
            - "--pass-user-headers=true"
            - "--set-xauthrequest=true"
            - "--skip-provider-button"
            - "--http-address=0.0.0.0:4181"
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
        {{ if .Values.kdl.enabled -}}
        - name: {{ .Values.username }}-ssh-keys
          secret:
            secretName: {{ .Values.username }}-ssh-keys
            items:
            - key: KDL_USER_PRIVATE_SSH_KEY
              path: id_rsa
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
