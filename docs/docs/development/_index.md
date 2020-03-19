---
title: "Development"
linkTitle: "Development"
weight: 50
description: >
  Information about how to start adding features to Science Toolkit
---

## Pre-requisites

The same requisites you need to install it locally.


## Installation variant

In order to start adding features to the Science Toolkit you first need a local installation.
You can follow the [Minikube installation guide](/docs/installation/minikube/) and only need to change this line:

Change this:
```
$/path/to/repo> ./local_env.sh
```

To this:
```
$/path/to/repo> ./local_env.sh --docker-build
```

### If you have previously installed it

Only if you have previously installed it without the build option, you need to clean the namespace and start over.

```
$path/to/repo> ./local_env.sh --dracarys
```

*Note*: the `--dracarys` option would reset the Minikube profile and start fresh.


### Operator SDK

If you want to make changes to the `vscode-operator` you'd need the Operator SDK installed.
You can follow this [operator-sdk installation guide](https://github.com/operator-framework/operator-sdk/blob/master/doc/user/install-operator-sdk.md)

That's all you need. The script `local_env.sh` will detect you have the command and it will run a build for the operator too.local_env


### Building docker images

You can build a single image instead of running `local_env.sh` each time.
You need to add some docker environment variables to work with Minikube instead of your host docker.previously

```
$> eval "$(minikube docker-env -p "toolkit")"
```

Now you can run `docker build` on that terminal and the image would be built inside Minikube.
If you have any running pods of the image you re-build, just delete it and Minikube would take care of restarting the container with the new image.previously

