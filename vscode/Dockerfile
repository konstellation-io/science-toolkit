FROM codercom/code-server:3.10.2

USER root

ARG GO_VERSION=1.15.2
ARG GOLANGCI_VERSION=1.24.0
ENV GOROOT /usr/local/go
ENV GO111MODULE=on
ENV GOPATH /go
ENV PATH=$GOPATH/bin:$GOROOT/bin:$PATH
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

RUN mkdir /config && mkdir /go

ADD ./common-science-requirements/apt_get_libraries.txt /config/apt_get_libraries.txt
ADD ./config/apt_get_libraries.txt /tmp/custom_apt_get_libraries.txt
RUN cat /tmp/custom_apt_get_libraries.txt >> /config/apt_get_libraries.txt

RUN apt-get update && \
    apt-get install -yq --no-install-recommends \
        gcc \
        wget \
        jq \
        vim \
        curl \
        xz-utils \
        less \
        openssh-client \
        git \
        bzip2 \
        zip \
        unzip \
        ca-certificates \
        sudo \
        locales \
        fonts-liberation \
        libaio1 \
        build-essential libssl-dev libffi-dev \
        libxml2-dev libxslt1-dev zlib1g-dev \
        python3 \
        python3-pip \
        python3-dev \
        protobuf-compiler \
        `cat /config/apt_get_libraries.txt | xargs` && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3 1 && \
    update-alternatives --set python /usr/bin/python3 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 2 && \
    update-alternatives --set pip /usr/bin/pip3

# Install Minio client
RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && \
    mv mc /usr/local/bin/mc

# Install Oracle client
ENV ORACLE_HOME /opt/oracle/instantclient_18_5
ENV LD_RUN_PATH=$ORACLE_HOME
COPY instantclient-* /tmp/
RUN mkdir -p /opt/oracle && \
	unzip "/tmp/instantclient*.zip" -d /opt/oracle && \
	sh -c "echo /opt/oracle/instantclient_18_5 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
	ldconfig && \
	export LD_LIBRARY_PATH=/opt/oracle/instantclient_18_5:$LD_LIBRARY_PATH

# Install Cloudera Impala driver
RUN wget https://downloads.cloudera.com/connectors/ClouderaImpala_ODBC_2.6.4.1004/Debian/clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
    dpkg -i clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
    apt-get update && \
    apt-get install -y odbcinst && \
    rm clouderaimpalaodbc_2.6.4.1004-2_amd64.deb

# Build unixodbx 2.3.7
RUN cd /tmp && \
    wget http://www.unixodbc.org/unixODBC-2.3.7.tar.gz && \
    tar xvf unixODBC-2.3.7.tar.gz && \
    cd unixODBC-2.3.7/ && \
    ./configure && \
    make && \
    make install && \
    cd .. && rm unixODBC-2.3.7 -rf

RUN pip install setuptools wheel && \
    pip install cython thriftpy

# Install Libraries
ADD ./common-science-requirements/frameworks_requirements.txt /config/frameworks_requirements.txt
ADD ./config/frameworks_requirements.txt /tmp/custom_frameworks_requirements.txt
RUN cat /tmp/custom_frameworks_requirements.txt >> /config/frameworks_requirements.txt

RUN pip install -r /config/frameworks_requirements.txt

# Install Libraries
ADD ./common-science-requirements/requirements.txt /config/requirements.txt
ADD ./config/requirements.txt /tmp/custom_requirements.txt
RUN cat /tmp/custom_requirements.txt >> /config/requirements.txt

RUN pip install --upgrade pip

RUN pip install -r /config/requirements.txt

# Golang
RUN curl -O https://dl.google.com/go/go$GO_VERSION.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go$GO_VERSION.linux-amd64.tar.gz \
    && rm go$GO_VERSION.linux-amd64.tar.gz

ADD ./config/go_packages.txt /config/go_packages.txt

COPY default_user_settings.json /config/default_user_settings.json

#
# Install extensions
#
RUN mkdir /extensions
RUN code-server \
      --install-extension christian-kohler.path-intellisense \
      --install-extension eamodio.gitlens \
      --install-extension gruntfuggly.todo-tree \
      --install-extension jithurjacob.nbpreviewer \
      --install-extension mechatroner.rainbow-csv \
      --install-extension mhutchie.git-graph \
      --install-extension ms-python.python \
      --install-extension golang.go \
      --install-extension njpwerner.autodocstring \
      --install-extension redhat.vscode-yaml \
      --install-extension tushortz.python-extended-snippets \
      --install-extension vscode-icons-team.vscode-icons \
      --install-extension wayou.vscode-todo-highlight \
      --install-extension yzhang.markdown-all-in-one \
      --install-extension zxh404.vscode-proto3 \
      --extensions-dir /extensions \
      /home/coder

RUN chown coder:coder /go /home/coder /extensions -R && rm /tmp/* -rf

USER coder

# Tools needed for VSCode Go Extension
RUN go get -v $(cat /config/go_packages.txt)
RUN go get -v golang.org/x/tools/gopls

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
