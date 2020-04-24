

# Dockerfile

```
apk add --update python python-dev py-pip build-base postgresql-client
pip install awscli==1.14.10 --upgrade --user
```

# Secrets

```
echo "postgres:5432:gitea:postgres:test" > ~/.pgpass
chown 600 ~/.pgpass
export PGPASSFILE=/root/.pgpass
export AWS_ACCESS_KEY_ID=xxxx
export AWS_SECRET_ACCESS_KEY=xxxx

BUCKET_NAME
```

# Job commands

```
mkdir backup_gitea_$(date +%Y%m%d)
tar zcvf backup_gitea_$(date +%Y%m%d)/data.tar.gz /data/
pg_dump -h postgres -p 5432 -U postgres -d gitea -v -F c -f backup_gitea_$(date +%Y%m%d)/postgres_gitea.dump
tar zcvf backup_gitea_$(date +%Y%m%d).tar.gz backup_gitea_$(date +%Y%m%d)
/root/.local/bin/aws s3 cp backup_gitea_$(date +%Y%m%d).tar.gz s3://science-toolkit-gitea-backup/backup_gitea_$(date +%Y%m%d).tar.gz
```

# Helm Values

# Restore

## Remove gitea statefulset
`kubectl -n toolkit delete statefulset gitea`

## Downalod the backup

`/root/.local/bin/aws s3 cp s3://science-toolkit-gitea-backup/backup_gitea_20200424.tar.gz .`

## Unzip backup

`tar zxvf backup_gitea_20200424.tar.gz`

## Restore /data files
```bash
cd backup_gitea_20200424/
tar zxvf data.tar.gz
cp -R data/* /data/
chown -R 1000:1000 /data/
```
## Restore postgres db

`dropdb -h postgres -U postgres gitea`

```bash
$ psql -h postgres -U postgres
Password for user postgres: 
psql (12.2, server 12.1 (Debian 12.1-1.pgdg100+1))
Type "help" for help.

postgres=# CREATE DATABASE gitea;

```

`pg_restore -h postgres -U postgres -v -d gitea ./postgres_gitea.dump`

## Redeploy science-toolkit to create Gitea installation

`./local_env.sh`

or

`helm upgrade --install ....`



