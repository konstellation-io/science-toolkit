FROM nvidia/cuda:9.2-cudnn7-devel-ubuntu18.04

ARG GO_VERSION=1.13.1
ARG NODE_VERSION=10.16.3
ARG YARN_VERSION=1.19.1

ARG NB_USER="jovyan"
ARG NB_UID="1000"
ARG NB_GID="100"

USER root

# Install all OS dependencies for notebook server that starts but lacks all
# features (e.g., download as all possible file formats)
ADD ./config/apt_get_libraries.txt apt_get_libraries.txt

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -yq dist-upgrade \
    && apt-get install -yq --no-install-recommends \
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
    `cat apt_get_libraries.txt | xargs` \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen

# Configure environment
ENV SHELL=/bin/bash \
    NB_USER=$NB_USER \
    NB_UID=$NB_UID \
    NB_GID=$NB_GID \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8
ENV HOME=/home/$NB_USER

# Install Node, Npm & Yarn
RUN cd /opt && \
    curl -s -O https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz && \
    tar -xf node-v${NODE_VERSION}-linux-x64.tar.xz && \ 
    ln -s /opt/node-v${NODE_VERSION}-linux-x64 /opt/node && \
    rm node-v${NODE_VERSION}-linux-x64.tar.xz

RUN cd /opt && \
    curl -L -O https://yarnpkg.com/downloads/${YARN_VERSION}/yarn-v${YARN_VERSION}.tar.gz  && \
    tar zvxf yarn-v${YARN_VERSION}.tar.gz && \
    ln -s yarn-v${YARN_VERSION} /opt/yarn && \
    rm yarn-v${YARN_VERSION}.tar.gz

ENV NODEJS_HOME /opt/node
ENV YARN_HOME /opt/yarn
ENV PATH=$NODEJS_HOME/bin:$YARN_HOME/bin:$PATH

# Download & Install Go
RUN mkdir -p /usr/local/go && \
    mkdir -p /home/$NB_USER/go && \
    curl -s https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz | tar xzf - -C /usr/local/go --strip-components=1

# Set GO environment variables.
ENV GOROOT /usr/local/go
ENV GOPATH $HOME/go
ENV PATH $GOROOT/bin:$GOPATH/bin:$PATH

# Install Minio client

RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && \
    mv mc /usr/local/bin/mc

ADD fix-permissions /usr/local/bin/fix-permissions
# Create jovyan user with UID=1000 and in the 'users' group
# and make sure these dirs are writable by the `users` group.
RUN groupadd wheel -g 11 && \
    echo "auth required pam_wheel.so use_uid" >> /etc/pam.d/su && \
    useradd -m -s /bin/bash -N -u $NB_UID $NB_USER && \
    chmod g+w /etc/passwd && \
    fix-permissions $HOME

# Fix apt user permissions
RUN fix-permissions /usr/bin
RUN fix-permissions /usr/sbin
RUN fix-permissions /var/

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

RUN pip3 install setuptools

RUN pip3 install --no-cache-dir \
    'notebook==6.0.1' \
    'jupyterhub==1.0.0' \
    'jupyterlab==1.1.4' 

RUN jupyter serverextension enable --py jupyterlab --sys-prefix

RUN jupyter notebook --generate-config

# Install Frameworks
ADD ./config/frameworks_requirements.txt frameworks_requirements.txt

RUN pip3 install -r frameworks_requirements.txt

# Install Libraries
ADD ./config/requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

# Install Jupyterlab Extensions
ADD ./config/jupyterlab_extensions.txt jupyterlab_extensions.txt

RUN rm -rf /home/$NB_USER/.cache/yarn && \
    jupyter labextension install `cat jupyterlab_extensions.txt | xargs`

RUN jupyter serverextension enable --py jupyterlab_git && \
    jupyter serverextension enable --py jupyter_archive

RUN jupyter lab build && \
    fix-permissions /home/$NB_USER

# Add Tini
ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

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
ENTRYPOINT ["/tini", "-g", "--"]
CMD ["start-notebook.sh"]
