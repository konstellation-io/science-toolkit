FROM codercom/code-server:3.0.1

ENV GO_VERSION 1.14
ENV GOROOT /usr/local/go
ENV PATH=$GOPATH/bin:$GOROOT/bin:$PATH

USER root
RUN curl -O https://dl.google.com/go/go$GO_VERSION.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go$GO_VERSION.linux-amd64.tar.gz \
    && rm go$GO_VERSION.linux-amd64.tar.gz

COPY extensions /extensions
RUN chown coder:coder /extensions

USER coder

ENTRYPOINT ["dumb-init", "code-server", "--auth", "none", "--host", "0.0.0.0", \
"--extensions-dir", "/extensions", "--disable-updates", "--disable-telemetry", \
"--user-data-dir", "/home/coder"]
