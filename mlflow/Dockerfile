FROM python:3.6.9-stretch

# ENV MLFLOW_S3_ENDPOINT_URL
# ENV AWS_ACCESS_KEY_ID
# ENV AWS_SECRET_ACCESS_KEY
# ENV ARTIFACTS_BUCKET

RUN pip install mlflow==1.3.0 boto3==1.10.4

WORKDIR /mlflow/tracking

CMD mlflow server --default-artifact-root s3://$ARTIFACTS_BUCKET --host 0.0.0.0
