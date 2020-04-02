# Runner Image

This Dockerfile is a basic science-toolkit runner with python libraries

The goal of this image is to be run by Drone.io on Kubernetes.

This component is part of a toolkit used to simplify the data scientists daily work.


## How update this Image

To update this image there are 3 files in `runner-image/config` where you can add new elements:

| File                        | Description            |
| --------------------------- | ---------------------- |
| apt_get_libraries.txt       | Apt libraries          |
| frameworks_requirements.txt | Python Frameworks      |
| requirements.txt            | Python extra libraries |

After modifying the file, the commit message need to start with `fix(requirements):<git message>` or `feat(requiremtens):<git message>`
