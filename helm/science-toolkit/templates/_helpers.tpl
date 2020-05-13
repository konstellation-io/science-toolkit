{{/*
Add the protocol part to the uri
*/}}
{{- define "protocol" -}}
  {{ ternary "https" "http" .Values.tls.enable }}
{{- end -}}
