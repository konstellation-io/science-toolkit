# VS Code

Custom Visual Studio Code Docker image with preconfigured extensions.

This is based on already existing [Docker image](https://hub.docker.com/r/codercom/code-server)

This component is part of a toolkit used to simplify the data scientists daily work. 
For more details check out the [Science Toolkit documentation](https://konstellation-io.github.io/science-toolkit/)

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

- Edit the Dockerfile using the `--install-extesion` option of the `code-server` CLI:

```
--install-extension    Install or update a VS Code extension by id or vsix. The identifier of an extension is `${publisher}.${name}`.
                             To install a specific version provide `@${version}`. For example: 'vscode.csharp@1.2.3'.
```
