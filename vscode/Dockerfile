FROM codercom/code-server:3.0.1

ENV GO_VERSION 1.14
ENV GOROOT /usr/local/go
ENV PATH=$GOPATH/bin:$GOROOT/bin:$PATH

USER root
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
RUN apt update && \
    apt -y install python3.7 python3-pip python3.7-dev && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.7 1 && \
    update-alternatives --set python3 /usr/bin/python3.7 && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.7 2 && \
    update-alternatives --set python /usr/bin/python3.7 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 3 && \
    update-alternatives --set pip /usr/bin/pip3

RUN pip install jupyter pylint mlflow

RUN curl -O https://dl.google.com/go/go$GO_VERSION.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go$GO_VERSION.linux-amd64.tar.gz \
    && rm go$GO_VERSION.linux-amd64.tar.gz

COPY extensions /extensions
RUN chown coder:coder /extensions

USER coder


ENTRYPOINT ["dumb-init", "code-server", "--auth", "none", "--host", "0.0.0.0", \
"--extensions-dir", "/extensions", "--disable-updates", "--disable-telemetry", \
"/home/coder"]
