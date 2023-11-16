# Trino-Ranger-Plugin
 
Apache Ranger offers support for various plugins such as HDFS, Hive, Yarn, Trino, and more. The Trino-Ranger-Plugin is a specific component responsible for interacting with the Ranger Admin to validate and retrieve access policies which are then synchronized with the Trino Server and stored as JSON files in the directory /etc/ranger/trino/policycache.
 
To configure Trino Ranger policies, access the Ranger-Admin UI and log in as an admin user. 
 
### Creating Ranger Policy for Users/Groups/Roles
Trino requires distinct policies for each object level. Unlike other ranger plugins, in Trino, policies need to be defined separately for catalog, schema, table, and columns. Specifically, for each user/group, policies need to be configured at the catalog level, catalog+schema level, and catalog+schema+table level. This granularity is unique to Trino and differs from the policy configuration approach of other Ranger plugins which allows a single comprehensive policy definition.
