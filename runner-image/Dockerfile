FROM nvidia/cuda:10.2-cudnn7-devel-ubuntu18.04 

USER root

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive
ENV TZ=Europe/Madrid

# Install all OS dependencies for notebook server that starts but lacks all
# features (e.g., download as all possible file formats)
COPY ./common-science-requirements/apt_get_libraries.txt apt_get_libraries.txt
COPY ./config/apt_get_libraries.txt custom_apt_get_libraries.txt
RUN cat custom_apt_get_libraries.txt >> apt_get_libraries.txt

## Install Frameworks
COPY ./common-science-requirements/frameworks_requirements.txt frameworks_requirements.txt
COPY ./config/frameworks_requirements.txt custom_frameworks_requirements.txt
RUN cat custom_frameworks_requirements.txt >> frameworks_requirements.txt

## Install Libraries
COPY ./common-science-requirements/requirements.txt requirements.txt
COPY ./config/requirements.txt custom_requirements.txt
RUN cat custom_requirements.txt >> requirements.txt

# Install OS packages && Python 3.9.6 && Set Python 3.9.6 as default
RUN apt-get update && apt-get -yq dist-upgrade \
    && apt-get install -yq --no-install-recommends \
    software-properties-common \
    wget \
    curl \
    xz-utils \
    less \
    openssh-client \
    git \
    bzip2 \
    zip \
    unzip \
    ca-certificates \
    locales \
    fonts-liberation \
    libaio1 \
    build-essential libssl-dev libffi-dev \
    libxml2-dev libxslt1-dev zlib1g-dev \
    `cat apt_get_libraries.txt | xargs` && \
    add-apt-repository ppa:deadsnakes/ppa -y && \
    apt install --no-install-recommends -yq python3.9 python3.9-dev python3-pip python3.9-distutils && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1 && \
    update-alternatives --set python3 /usr/bin/python3.9 && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.9 2 && \
    update-alternatives --set python /usr/bin/python3.9 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 3 && \
    update-alternatives --set pip /usr/bin/pip3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen

# Install Minio client
RUN wget -q https://dl.min.io/client/mc/release/linux-amd64/mc && \
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
RUN wget -q https://downloads.cloudera.com/connectors/ClouderaImpala_ODBC_2.6.4.1004/Debian/clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
    dpkg -i clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
    apt-get update && \
    apt-get install -y odbcinst

# Build unixodbx 2.3.7
RUN cd /tmp && \
    wget -q http://www.unixodbc.org/unixODBC-2.3.7.tar.gz && \
    tar xvf unixODBC-2.3.7.tar.gz && \
    cd unixODBC-2.3.7/ && \
    ./configure && \
    make && \
    make install

# PYTHON TASKS
RUN pip install --upgrade pip && \
    pip install setuptools distlib wheel && \
    pip install --no-cache-dir cython thriftpy2 && \
    pip install -r frameworks_requirements.txt && \
    pip install -r requirements.txt --ignore-installed PyYAML
