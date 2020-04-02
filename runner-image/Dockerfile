FROM ubuntu:latest

USER root
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

# Install all OS dependencies for notebook server that starts but lacks all
# features (e.g., download as all possible file formats)
ADD ./config/apt_get_libraries.txt apt_get_libraries.txt

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -yq dist-upgrade \
    && apt-get install -yq --no-install-recommends \
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
    `cat apt_get_libraries.txt | xargs` \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen

RUN apt update && \
    apt -y install python3.6 python3-pip python3.6-dev && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.6 1 && \
    update-alternatives --set python3 /usr/bin/python3.6 && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.6 2 && \
    update-alternatives --set python /usr/bin/python3.6 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 3 && \
    update-alternatives --set pip /usr/bin/pip3


RUN pip install setuptools wheel

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

# Install Frameworks
ADD ./config/frameworks_requirements.txt frameworks_requirements.txt

RUN pip install -r frameworks_requirements.txt

# Install Libraries
ADD ./config/requirements.txt requirements.txt

RUN pip install -r requirements.txt
