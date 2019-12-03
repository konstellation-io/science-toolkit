FROM codercom/code-server:v2

COPY extensions /home/coder/.local/share/code-server/extensions
USER root

ENTRYPOINT ["dumb-init", "code-server", "--host", "0.0.0.0","--extensions-dir","/home/coder/.local/share/code-server/extensions"]