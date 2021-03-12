# User Repo Cloner

This module is responsible for automatically cloning the internal and external repositories of the projects in which the
user participates. This way they are available for other tools, such as Jupyter and VSCode to be able to work with them.

To do this, it checks periodically the projects collection in the database, to locate the ones that the user is
included in. So, those who do not have a folder with the code, try to clone the repository. For this it is necessary
that the user's public key is included in the platform where the repository is stored (github, gitlab, gitea etc), so
that cloning through ssh is possible.

## Configuration

| Environment variable      | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| KDL_USER_NAME             | (required) username from which the repositories are to be cloned.         |
| LOG_LEVEL                 | (optional) log verbosity level. Possibilities: debug, info, warn, error.  |
| INTERNAL_REPO_BASE_URL    | (optional) base url to access internal gitea repositories.                |
| REPOS_PATH                | (optional) absolute path to store the cloned repositories.                |
| PEM_FILE                  | (optional) absolute path to user private ssh key.                         |
| PEM_FILE_PASSWORD         | (optional) password for user private ssh key.                             |
| CHECK_FREQUENCY_SECONDS   | (optional) frequency of checking new repositories (seconds)               |
| KDL_SERVER_MONGODB_URI    | (optional) mongoDB URI.                                                   |
| DB_NAME                   | (optional) KDL database name.                                             |
| PROJECT_COLL_NAME         | (optional) projects collection name.                                      |
| USER_COLL_NAME            | (optional) user collection name.                                          |

