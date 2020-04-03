FROM codercom/code-server:3.0.1

USER root

ENV GO_VERSION 1.14
ENV GOROOT /usr/local/go
ENV PATH=$GOPATH/bin:$GOROOT/bin:$PATH
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

ADD ./config/apt_get_libraries.txt apt_get_libraries.txt

RUN apt-get update && \
    apt-get -yq upgrade && \
    apt-get install -yq --no-install-recommends \
        gcc \
        wget \
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
        `cat apt_get_libraries.txt | xargs` && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3 1 && \
    update-alternatives --set python /usr/bin/python3 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 2 && \
    update-alternatives --set pip /usr/bin/pip3


RUN curl -O https://dl.google.com/go/go$GO_VERSION.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go$GO_VERSION.linux-amd64.tar.gz \
    && rm go$GO_VERSION.linux-amd64.tar.gz


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
    apt-get install -y odbcinst

# Build unixodbx 2.3.7
RUN cd /tmp && \
    wget http://www.unixodbc.org/unixODBC-2.3.7.tar.gz && \
    tar xvf unixODBC-2.3.7.tar.gz && \
    cd unixODBC-2.3.7/ && \
    ./configure && \
    make && \
    make install

RUN pip install setuptools wheel && \
    pip install cython thriftpy

# Install Frameworks
ADD ./config/frameworks_requirements.txt frameworks_requirements.txt

RUN pip install -r frameworks_requirements.txt

# Install Libraries
ADD ./config/requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY extensions /extensions
RUN chown coder:coder /extensions

USER coder


ENTRYPOINT ["dumb-init", "code-server", "--auth", "none", "--host", "0.0.0.0", \
"--extensions-dir", "/extensions", "--disable-updates", "--disable-telemetry", \
"/home/coder"]
