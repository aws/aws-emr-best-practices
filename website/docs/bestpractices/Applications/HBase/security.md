# Security

The following section describes the main security aspects that can help you to secure an HBase cluster running on Amazon EMR.

## Authentication

By default when launching an Amazon EMR cluster with HBase installed, the service will configure HBase without enabling any type of authentication. This allows every client connecting to HBase to read / write tables stored in the cluster without the need to provide any credentials. In this context it is a best practice to limit access to the cluster by scoping access to the cluster using firewalls or [EMR Security Groups](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-security-groups.html) attached to the cluster. For more details see [Networking](#networking)

However, if you require to enable a strong authentication system, you can use Kerberos authentication to secure your cluster. HBase implements the Simple Authentication and Security Layer (SASL) at the RPC level, that will handle authentication and encryption negotiation for each connection established with the service.

Amazon EMR automatically configures HBase with the required configurations when you launch a cluster with a Security Configuration where Kerberos authentication is enabled. The following highlights the main HBase configurations set by the service when launching an EMR cluster with Kerberos enabled (generated using Amazon EMR 6.9.0):

| Configuration                                    | Value                              |
|--------------------------------------------------|------------------------------------|
| **hbase.security.authentication**                | `kerberos`                           |
| **hbase.security.authorization**                 | `true`                               |
| **hbase.master.kerberos.principal**              | `hbase/_HOST@<YOUR_KERBEROS_REALM>`  |
| **hbase.master.keytab.file**                     | `/etc/hbase.keytab`                  |
| **hbase.regionserver.kerberos.principal**        | `hbase/_HOST@<YOUR_KERBEROS_REALM>`  |
| **hbase.regionserver.keytab.file**               | `/etc/hbase.keytab`                  |
| **hbase.thrift.kerberos.principal**              | `hbase/_HOST@<YOUR_KERBEROS_REALM>`  |
| **hbase.thrift.keytab.file**                     | `/etc/hbase.keytab`                  |
| **hbase.thrift.security.qop**                    | `auth`                               |
| **hbase.rest.authentication.type**               | `kerberos`                           |
| **hbase.rest.authentication.kerberos.principal** | `HTTP/_HOST@<YOUR_KERBEROS_REALM>`   |
| **hbase.rest.authentication.kerberos.keytab**    | `/etc/hbase.keytab`                  |
| **hbase.rest.kerberos.principal**                | `hbase/_HOST@<YOUR_KERBEROS_REALM>`  |
| **hbase.rest.keytab.file**                       | `/etc/hbase.keytab`                  |
| **hbase.rest.support.proxyuser**                 | `true`                               |
| **hadoop.proxyuser.hbase.groups**                | `*`                                  |
| **hadoop.proxyuser.hbase.hosts**                 | `*`                                  |

To launch an EMR cluster with Kerberos Authentication, please refer to [Configuring Kerberos on Amazon EMR](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-kerberos-configure.html)

## Authorization

Once the users are authenticated through Kerberos, we can now implement our Authorization policies to allow restricted access for specific user to our tables. To enable this functionality, it’s required to enable the Access Controller Coprocessor, by adding additional configurations when launching the EMR cluster. Below an example EMR configuration:

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.coprocessor.master.classes": "org.apache.hadoop.hbase.security.access.AccessController",
      "hbase.coprocessor.region.classes": "org.apache.hadoop.hbase.security.token.TokenProvider,org.apache.hadoop.hbase.security.access.AccessController",
      "hbase.security.authorization": "true",
      "hbase.security.exec.permission.checks": "true"
    }
  }
]
```

In order to grant permissions to specific users in the cluster, you must define the ACL policies using the `hbase` admin user. For example, the below command add the `READ('R')`, `WRITE('W')`, `EXEC('X')`, `CREATE('C')`, `ADMIN('A')` permissions to the `hadoop` user:

```bash
sudo -s
kdestroy
kinit hbase/`hostname -f`@YOUR_KERBEROS_REALM -k -t /etc/hbase.keytab
hbase shell
grant 'hadoop', 'RWXCA'
```

For additional details, please see the [Administration](https://hbase.apache.org/book.html#_administration) section in official HBase documentation.

## Networking

It’s always a good practice to restrict network access to the cluster to reduce the exposure of the services to external attacks. When using Amazon EMR, you can specify additional Security Groups attached to the cluster to enable network communication with the cluster from pre-defined ranges of IPs or other AWS Security Groups. The tables below provides HBase ports you can control in the EMR Security Groups to allow interactions with trusted parties.

For additional information see [Control network traffic with security groups](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-security-groups.html) in the EMR documentation.

### HBase Services Ports

| Port        | Security Group | Description           |
|-------------|----------------|-----------------------|
| 2181 / TCP  | Master         | Zookeeper client port |
| 16000 / TCP | Master         | HMaster               |
| 16020 / TCP | Core & Task    | Region Server         |
| 8070 / TCP  | Master         | REST server           |
| 9090 / TCP  | Master         | Thrift Server         |

### HBase Web UI Ports

| Port        | Security Group | Description          |
|-------------|----------------|----------------------|
| 16010 / TCP | Master         | HMaster Web UI       |
| 16030 / TCP | Core & Task    | Region Server Web UI |
| 8085 / TCP  | Master         | REST Server UI       |
| 9095 / TCP  | Master         | Thrift Server UI     |
