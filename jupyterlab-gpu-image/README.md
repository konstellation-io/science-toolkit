# Jupyter Lab GPU

This Dockerfile and the rest of scripts have been taken from the repository [Zero to JupyterHub](https://github.com/jupyter/docker-stacks/tree/master/base-notebook)

The goal of this image is to be run by JupyterHub on Kubernetes.

This component is part of a toolkit used to simplify the data scientists daily work.
For more details check out the [Science Toolkit documentation](https://konstellation-io.github.io/science-toolkit/)


## About JupyterLab

Please visit the documentation site for help using and contributing to this image and others.

* [Jupyter Docker Stacks on ReadTheDocs](http://jupyter-docker-stacks.readthedocs.io/en/latest/index.html)
* [Selecting an Image :: Core Stacks :: jupyter/base-notebook](http://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#jupyter-base-notebook)

This component is part of a toolkit used to simplify the data scientists daily work. 
For more details check out the [Science Toolkit documentation](https://konstellation-io.github.io/science-toolkit/)

## How update this Image

To update this image there are 3 files in `jupyterlab-gpu-image/config` where you can add new elements:

| File                        | Description            |
| --------------------------- | ---------------------- |
| apt_get_libraries.txt       | Apt libraries          |
| frameworks_requirements.txt | Python Frameworks      |
| jupyterlab_extensions.txt   | JupyterLab Extensions  |
| requirements.txt            | Python extra libraries |

After modifying the file, the commit message need to start with `fix(requirements):<git message>` or `feat(requiremtens):<git message>`

## How connect  with shared data from jupyter notebook

To upload a datasets from jupyter notebook to minio just run the below command.

```bash
mc ls minio
mc cp <data_set_file> minio/<project>/<subfolder>
```
