apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: {{ include "codeserver.fullname" . }}
  labels:
{{ include "codeserver.labels" . | indent 4 }}
spec:
  serviceName: {{ include "codeserver.fullname" . }}
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ include "codeserver.name" . }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ include "codeserver.name" . }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app: codeserver-{{ .Values.username }}
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
                name: codeserver-oauth2-secrets-{{ .Values.username }}
            - configMapRef:
                name: gitea-configmap
      containers:
        - name: {{ .Chart.Name }}
          image: terminus7/sci-toolkit-vscode:${VSCODE_TAG}
          imagePullPolicy: IfNotPresent
          {{ if .Values.sharedVolume.name -}}
          volumeMounts:
            - name: {{ .Values.sharedVolume.name }}
              mountPath: /home/coder/projects
          {{- end }}
        - name: {{ .Chart.Name }}-proxy
          image: terminus7/oauth2-proxy:latest
          imagePullPolicy: IfNotPresent
          args:
            - "-config"
            - "/etc/oauth2_proxy.cfg"
            - "-email-domain"
            - "*"
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
                  name: codeserver-oauth2-secrets-{{ .Values.username }}
                  key: CODESERVER_OAUTH2_CLIENT_ID
            - name: OAUTH2_PROXY_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: codeserver-oauth2-secrets-{{ .Values.username }}
                  key: CODESERVER_OAUTH2_CLIENT_SECRET
          volumeMounts:
            - name: oauth2-config
              mountPath: /etc/oauth2_proxy.cfg
              subPath: oauth2_proxy.cfg
          ports:
            - name: http
              containerPort: 4180
              protocol: TCP

      volumes:
        - name: oauth2-config
          configMap:
            name: {{ include "codeserver.fullname" . }}-oauth2-proxy
        {{ if .Values.sharedVolume.name -}}
        - name: {{ .Values.sharedVolume.name }}
          persistentVolumeClaim:
            claimName: {{ .Values.sharedVolume.name }}-claim
        {{- end }}
  volumeClaimTemplates:
      - metadata:
          name: vscode-pvc
          labels:
            app: vscode
        spec:
          accessModes:
            - ReadWriteOnce
          storageClassName: {{ .Values.storage.className }}
          resources:
            requests:
              storage:  {{ .Values.storage.size }}
