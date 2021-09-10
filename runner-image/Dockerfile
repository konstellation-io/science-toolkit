# FROM nvidia/cuda:11.2.2-cudnn8-runtime-ubuntu20.04
FROM nvidia/cuda:10.2-cudnn7-devel-ubuntu18.04

# Maintainer of the Dockerfile
LABEL maintainer "Intelygenz - Konstellation Team"

# Input data
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive
ENV TZ=Europe/Madrid
ENV ORACLE_HOME /opt/oracle/instantclient_18_5
ENV LD_RUN_PATH=$ORACLE_HOME

ARG NON_ROOT_USER=nroot

# Switch to ROOT user to do maintenance tasks
USER root

# Set workdir to tmp
WORKDIR /tmp

# Copy requirements.txt && instantclient zip files to workdir
COPY requirements.txt /tmp/
COPY instantclient-* /tmp/

# Install required packages
RUN apt-get update && apt-get install -yq --no-install-recommends \
        software-properties-common && \
        add-apt-repository ppa:deadsnakes/ppa -y && \
        apt-get install -yq --no-install-recommends \
            build-essential \
            bzip2 \
            ca-certificates \
            less \
            openssh-client \
            fonts-liberation \
            git \
            libaio1 \
            libffi-dev \
            libgtk2.0-dev \
            libssl-dev \
            libllvm-10-ocaml-dev \
            libxml2-dev \
            libxslt1-dev \
            llvm-10 \
            llvm-10-dev \
            llvm-10-runtime \
            llvm-10-tools \
            locales \
            odbcinst \
            python3.9 \
            python3.9-dev \
            python3.9-distutils \
            python3-pip \
            unzip \
            wget \
            xz-utils \
            zip \
            zlib1g-dev && \
    # Set Python 3.9 as default
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1 && \
        update-alternatives --set python3 /usr/bin/python3.9 && \
        update-alternatives --install /usr/bin/python python /usr/bin/python3.9 2 && \
        update-alternatives --set python /usr/bin/python3.9 && \
        update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 3 && \
        update-alternatives --set pip /usr/bin/pip3 && \
    # Install Minio client
    wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc && \
        chmod +x /usr/local/bin/mc && \
    # Install Cloudera Impala driver
    wget -q https://downloads.cloudera.com/connectors/ClouderaImpala_ODBC_2.6.4.1004/Debian/clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
        dpkg -i clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
    # Install Oracle client
    mkdir -p /opt/oracle && \
        unzip "/tmp/instantclient*.zip" -d /opt/oracle && \
        sh -c "echo /opt/oracle/instantclient_18_5 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
        ldconfig && \
        export LD_LIBRARY_PATH=/opt/oracle/instantclient_18_5:$LD_LIBRARY_PATH && \
    # Build unixodbx 2.3.7
    wget -q http://www.unixodbc.org/unixODBC-2.3.7.tar.gz && \
        tar xvf unixODBC-2.3.7.tar.gz && \
        cd unixODBC-2.3.7/ && \
        ./configure && \
        make && \
        make install && \
        make clean

# Configure locale
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
        locale-gen

# Install Python libraries
RUN pip install --upgrade pip && \
        pip install --no-cache-dir setuptools distlib wheel && \
        pip install --no-cache-dir cython thriftpy2 && \
        pip install --no-cache-dir -r requirements.txt --ignore-installed PyYAML

# Create a non-root user
RUN groupadd ${NON_ROOT_USER} --gid 1001                                  && \
    useradd ${NON_ROOT_USER} --system --create-home --uid 1001 --gid 1001 && \
    chown ${NON_ROOT_USER}:${NON_ROOT_USER} /home/${NON_ROOT_USER}

# Clean up
RUN rm --recursive --force -- * && \
        apt-get clean && apt-get autoremove -y && \
        rm -rf /var/lib/{apt,dpkg,cache,log}/

# Change workdir to / TEMPORARILY
WORKDIR /

# Use non-root user
# USER ${NON_ROOT_USER}

# Set workdir to user home
# WORKDIR /home/${NON_ROOT_USER}
