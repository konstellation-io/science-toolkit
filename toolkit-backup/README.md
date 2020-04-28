

# Toolkit backup

The image to perform the Science Toolkits backups require of AWS CLI, in order to upload the backup to an external S3, and 
Postgres client, to backup the database. 

# Backup schedule

The Science Toolkit Helm Chart is ready to configure the backup schedule as a cronjob. You only need to edit your custom 
`values.yaml` with the following information. You will need an AWS S3 bucket and AWS key pairs to upload the backup.

```yaml
backup:
  gitea:
    enabled: true
    schedule: "0 6 */1 * *" # every day at 6:00 AM
  s3:
    awsAccessKeyID: <yourawskeyid>
    awsSecretAccessKey: <yourawssecretkey>
    bucketName: <yourS3BackupBucketName>
```

# How to restore Gitea

* Stop Gitea stateFulSet
  
`kubectl -n toolkit delete statefulset gitea`

* Deploy a pod from where perform the restore

`kubectl -n toolkit apply -f restore-pod.yaml`

* Download the required backup from S3 Bucket
  
`/root/.local/bin/aws s3 cp s3://science-toolkit-gitea-backup/backup_gitea_20200424.tar.gz .`

* Unzip backup

`tar zxvf backup_gitea_20200424.tar.gz`

* Restore /data files

```bash
cd backup_gitea_20200424/
tar zxvf data.tar.gz
cp -R data/* /data/
chown -R 1000:1000 /data/
```
* Restore postgres db

``

```bash
$ dropdb -h postgres -U postgres gitea
[...]

$ psql -h postgres -U postgres
Password for user postgres: 
psql (12.2, server 12.1 (Debian 12.1-1.pgdg100+1))
Type "help" for help.

postgres=# CREATE DATABASE gitea;
[...]

$ pg_restore -h postgres -U postgres -v -d gitea ./postgres_gitea.dump
```


* Redeploy science-toolkit to create Gitea installation

`helm upgrade --install toolkit --namespace toolkit science-toolkit/science-toolkit`

*NOTE:* the helm upgrade command will depend of your deployment, use this just as a guide not literal.
