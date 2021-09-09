FROM nvidia/cuda:10.2-cudnn7-runtime-ubuntu18.04

ARG GO_VERSION=1.14.2
ARG NODE_VERSION=14.4.0
ARG YARN_VERSION=1.19.1
ARG TINI_VERSION v0.18.0
ARG NB_USER="jovyan"
ARG NB_UID="1000"
ARG NB_GID="100"

USER root

WORKDIR /tmp

# Configure environment
ENV SHELL=/bin/bash \
    NB_USER=$NB_USER \
    NB_UID=$NB_UID \
    NB_GID=$NB_GID \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8
ENV HOME=/home/$NB_USER

# Set NodeJS environment variables
ENV NODEJS_HOME /opt/node
ENV YARN_HOME /opt/yarn
ENV PATH=$NODEJS_HOME/bin:$YARN_HOME/bin:$PATH

# Set GO environment variables.
ENV GOROOT /usr/local/go
ENV GOPATH $HOME/go
ENV PATH $GOROOT/bin:$GOPATH/bin:$PATH

# Oracle environment variables
ENV ORACLE_HOME /opt/oracle/instantclient_18_5
ENV LD_RUN_PATH=$ORACLE_HOME

# Install all OS dependencies for notebook server that starts but lacks all
# features (e.g., download as all possible file formats)

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
  apt-get install -yq --no-install-recommends \
    bzip2 \
    ca-certificates \
    curl \
    fonts-liberation \
    g++ \
    gcc \
    git \
    language-pack-es \
    less \
    libaio1 \
    libffi-dev  \
    libgtk2.0-dev \
    libllvm-10-ocaml-dev \
    llvm-10 \
    llvm-10-dev \
    llvm-10-runtime \
    llvm-10-tools \
    locales \
    odbcinst \
    openssh-client \
    python3.7 \
    python3.7-dev \
    python3-pip \
    sudo \
    unzip \
    xz-utils \
    zip && \
  # Install Cloudera Impala driver
  curl -s -O https://downloads.cloudera.com/connectors/ClouderaImpala_ODBC_2.6.4.1004/Debian/clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
    dpkg -i clouderaimpalaodbc_2.6.4.1004-2_amd64.deb && \
  update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.7 1 && \
    update-alternatives --set python3 /usr/bin/python3.7 && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.7 2 && \
    update-alternatives --set python /usr/bin/python3.7 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 3 && \
    update-alternatives --set pip /usr/bin/pip3 && \
  # Add Tini
    curl -s -L -o /usr/local/bin/tini https://github.com/krallin/tini/releases/download/v0.18.0/tini && \
    chmod +x /usr/local/bin/tini && \
  echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen

# Install Node, Npm, Yarn & Go
RUN curl -s -O https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz && \
    tar -xf node-v${NODE_VERSION}-linux-x64.tar.xz && \
    mv node-v${NODE_VERSION}-linux-x64 ${NODEJS_HOME} && \
    curl -L -O https://yarnpkg.com/downloads/${YARN_VERSION}/yarn-v${YARN_VERSION}.tar.gz  && \
    tar zxf yarn-v${YARN_VERSION}.tar.gz && \
    mv yarn-v${YARN_VERSION} ${YARN_HOME} && \
    mkdir -p ${GOROOT} && \
    mkdir -p /home/$NB_USER/go && \
    curl -s https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz | tar xzf - -C ${GOROOT} --strip-components=1
    

# Install Minio client
RUN curl -s -O https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && \
    mv mc /usr/local/bin/mc

# Install Oracle client
COPY instantclient-* /tmp/
RUN mkdir -p /opt/oracle && \
	unzip "/tmp/instantclient*.zip" -d /opt/oracle && \
	sh -c "echo $ORACLE_HOME > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
	ldconfig && \
	export LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH

# Build unixodbx 2.3.7
RUN curl -s -O http://www.unixodbc.org/unixODBC-2.3.7.tar.gz && \
    tar xvf unixODBC-2.3.7.tar.gz && \
    cd unixODBC-2.3.7/ && \
    ./configure && \
    make && \
    make install && \
    make clean && \
    cd ..

COPY fix-permissions /usr/local/bin/fix-permissions
# Create jovyan user with UID=1000 and in the 'users' group
# and make sure these dirs are writable by the `users` group.
RUN groupadd wheel -g 11 && \
    echo "auth required pam_wheel.so use_uid" >> /etc/pam.d/su && \
    useradd -m -s /bin/bash -N -u $NB_UID $NB_USER && \
    chmod g+w /etc/passwd && \
    fix-permissions $HOME && \
    # Fix apt user permissions
    fix-permissions /usr/bin && \
    fix-permissions /usr/sbin && \
    fix-permissions /var/

# Apt cleanup
RUN apt-get clean && apt-get autoremove -y && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/ && \
    rm -rf -- *


USER $NB_UID

# Setup work directory for backward-compatibility
RUN mkdir /home/$NB_USER/work && \
    fix-permissions /home/$NB_USER

# Install Jupyter Notebook, Lab, and Hub
# Generate a notebook server config
# Cleanup temporary files
# Correct permissions
# Do all this in a single RUN command to avoid duplicating all of the
# files across image layers when the permissions change

RUN mkdir -p /home/$NB_USER/.local/bin && \
    fix-permissions /home/$NB_USER/.local/bin

ENV PATH /home/$NB_USER/.local/bin:$PATH

USER root

# Install Python modules
COPY ./requirements.txt requirements.txt

RUN pip install --no-cache-dir setuptools wheel && \
    pip install --no-cache-dir cython thriftpy && \
    pip install pip --upgrade && \
    pip install --no-cache-dir -r requirements.txt --ignore-installed PyYAML && \
    ln -s /usr/bin/llvm-config-10 /usr/bin/llvm-config  

# Install Jupyterlab Extensions
COPY ./jupyterlab_extensions.txt jupyterlab_extensions.txt

RUN jupyter serverextension enable --py jupyterlab --sys-prefix && \
    jupyter notebook --generate-config && \
    jupyter labextension install `cat jupyterlab_extensions.txt | xargs` && \
    jupyter serverextension enable --py jupyterlab_git && \
    jupyter lab build && \
    fix-permissions /home/$NB_USER

EXPOSE 8888
WORKDIR $HOME

# Add local files as late as possible to avoid cache busting
COPY start.sh /usr/local/bin/
COPY start-notebook.sh /usr/local/bin/
COPY start-singleuser.sh /usr/local/bin/
COPY jupyter_notebook_config.py /etc/jupyter/
RUN fix-permissions /etc/jupyter/

# Switch back to jovyan to avoid accidental container runs as root
USER $NB_UID

ENV PATH $PATH:/home/jovyan/.local/bin

# Configure container startup
ENTRYPOINT ["tini", "-g", "--"]
CMD ["start-notebook.sh"]
