FROM codercom/code-server:v2

COPY extensions /extensions
USER root

ENTRYPOINT ["dumb-init", "code-server", "--auth", "none", "--host", "0.0.0.0", "--extensions-dir","/extensions"]
