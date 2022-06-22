# ** 5.2 - Hive **

## ** BP 5.2.1  -  Upgrading Hive Metastore **

When upgrading from EMR 5.x (hive 2.x) to EMR 6.x (hive 3.x), hive metastore requires a schema upgrade to support changes and new features in Hive 3.x The following steps assumes hive metastore is running on Amazon RDS. Upgrading hive metastore is backwards compatible. Once hive metastore is upgraded, both hive 2x and hive 3.x clients/clusters can use the same hive metastore. 

1\. Take a snapshot of current Hive Metastore on Amazon RDS

2\. Provision a new Amazon RDS with the snapshot that was created in step 1

3\. Provision target EMR 6.x version without configuring an external hive metastore

4\. SSH into EMR 6 cluster and update the below in hive-site.xml to point to new RDS from the previous step

 
```
"javax.jdo.option.ConnectionURL": "jdbc:mysql://hostname:3306/hive?createDatabaseIfNotExist=true",
"javax.jdo.option.ConnectionDriverName": "org.mariadb.jdbc.Driver",
"javax.jdo.option.ConnectionUserName": "username",
"javax.jdo.option.ConnectionPassword": "password"
```

5\.  Run the following to check current hms schema version:


```
hive --service schemaTool -dbType mysql -info
```

You should see the below. Make note of the current metastore schema version (2.3.0 in this case)

```    
Hive distribution version:              3.1.0
Metastore schema version:          2.3.0
org.apache.hadoop.hive.metastore.HiveMetaException: Metastore schema version is not compatible. Hive Version: 3.1.0, Database Schema Version: 2.3.0
Use --verbose for detailed stacktrace.
*** schemaTool failed \***
```    

6\. Change directory to the hive metastore upgrade scripts location

``` 
cd /usr/lib/hive/scripts/metastore/upgrade/mysql
``` 

Doing these steps on EMR 6.x is required because you need need the target hive distribution version (hive 3.1) and the upgrade scripts inorder to ugprade the schema.

7\. Connect to mysql using below command and upgrade the schema as per the hive version. For example, if you are upgrading from 2.3.0 to 3.1.0, you would need to source the 2 scripts. Scripts can also be found in this location: [https://github.com/apache/hive/tree/master/standalone-metastore/metastore-server/src/main/sql/mysql](https://github.com/apache/hive/tree/master/standalone-metastore/metastore-server/src/main/sql/mysql)

```
mysql -u<HIVEUSER> -h<ENDPOINT-RDS> -p'PASSWORD'
mysql> use hive; 
mysql> source upgrade-2.3.0-to-3.0.0.mysql.sql;
mysql> source upgrade-3.0.0-to-3.1.0.mysql.sql;
```

8\. Verify the upgrade was succesful 

```
/usr/lib/hive/bin/schematool -dbType mysql -info
Metastore connection URL:    jdbc:mysql://hostname:3306/hive?createDatabaseIfNotExist=true
Metastore Connection Driver :    org.mariadb.jdbc.Driver
Metastore connection User:   admin
Hive distribution version:   3.1.0
Metastore schema version:    3.1.0
schemaTool completed
``` 

9\. After all commands are run, terminate the cluster.
 
10\. Further validation:
Provision new 5.x and 6.x cluster with updated hive-site.xml that points to new RDS. In both version, you can run

```
hive --service schemaTool -dbType mysql -info
``` 
In 5.x you'll see
```
Hive distribution version:         2.3.0
Metastore schema version:          3.1.0
``` 
and in 6.x, you'll see
```
Hive distribution version:         3.1.0
Metastore schema version:          3.1.0
``` 
