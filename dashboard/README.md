# Dashboard

This image is a UI to access all components of the Science Toolkit. From here you can also control your VSCode instance.

This component is part of a toolkit used to simplify the data scientists daily work.
For more details check out the [Science Toolkit documentation](https://konstellation-io.github.io/science-toolkit/).


## Configuration

| Environment variable             | Description                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| TOOLKIT_VSCODE_STORAGE_SIZE      | desired size of the volume to use on each VSCode instance.                                                |
| TOOLKIT_VSCODE_STORAGE_CLASSNAME | storage class name used for the volume associated to VSCode instance.                                     |
| TOOLKIT_BASE_DOMAIN_NAME         | domain name used as part of the OAuth2 authentication on VSCode instances. Ex: toolkit.{your_domain_name} |
| TOOLKIT_SHARED_VOLUME            | optional name of a shared volume to mount on VSCode instance.                                             |
