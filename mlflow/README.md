# MLFlow Tracking Server 

This repo hold the creation of Docker image to run MLFlow Tracking Server.

This component is part of a toolkit used to simplify the data scientists daily work.
For more details check out the [Science Toolkit documentation](https://konstellation-io.github.io/science-toolkit/)


## Run it

With the following command you can access to the MLFlow Tracking server opening a browser the URL [http://localhost:5000](http://localhost:5000). The artifacts are stored in a Minio bucket and the logs in the local directory `/mlflow/tracking`, if you want to persist the log folder you need to mount an external volume to this path. The published Docker image is public in [Docker Hub](https://cloud.docker.com/u/terminus7/repository/docker/terminus7/mlflow).

```bash
docker run -p 5000:5000 \
        -e "MLFLOW_S3_ENDPOINT_URL=http://my_minio.url" 
        -e "AWS_ACCESS_KEY_ID=user" 
        -e "AWS_SECRET_ACCESS_KEY=pass" 
        -e "ARTIFACTS_BUCKET=mlflow-artifacts" 
        terminus7/mlflow:latest
```
