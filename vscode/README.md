# VS Code

Custom Visual Studio Code Docker image with preconfigured extensions.

This is based on already existing [Docker image](https://hub.docker.com/r/codercom/code-server)

This component is part of a toolkit used to simplify the data scientists daily work. 
For more details check out the [Science Toolkit documentation](https://intelygenz.github.io/science-toolkit/)

## Run

`docker run -it -p 127.0.0.1:8080:8080 -v "$PWD:/home/coder/project" terminus7/sci-toolkit-vscode`


## Extensions
- [Gitlens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- [Golang](https://github.com/microsoft/vscode-go)
- [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
- [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- [Markdown](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)

## How to update the extensions

- Run the following commands:
```bash
docker build -t vscode-demo . 
docker run -u root -it --network=host \
 -v $PWD/extensions:/extensions vscode-demo /home/coder 
```
- Update the extensions on VSCode.
- Commit new extensions and remove old on your extensions folders.

## How build this Image

From the repo root path run:

```bash
  ./scripts/clean_and_copy.sh common-science-requirements vscode
  docker build -t terminus7/sci-toolkit-vscode:latest vscode
  rm -rf vscode/common-science-requirements
```