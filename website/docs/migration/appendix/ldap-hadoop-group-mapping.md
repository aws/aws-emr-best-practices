---
sidebar_label: LDAP for Hadoop Group Mapping
---

# Example LDAP Configuration for Hadoop Group Mapping

Below shows a sample Amazon EMR configuration file to set up Hadoop Group Mapping to use LDAP directly. Use this setup for clusters without Kerberos.

> \[
>
> \{
>
> "classification":"core-site", "properties":\{
>
> "hadoop.security.group.mapping.ldap.search.attr.member":"member", "hadoop.security.group.mapping.ldap.search.filter.user":"(objectclass=\*)", "hadoop.security.group.mapping.ldap.search.attr.group.name":"cn", "hadoop.security.group.mapping.ldap.base":"dc=corp,dc=emr,dc=local", "hadoop.security.group.mapping":"org.apache.hadoop.security.LdapGroupsMapping", "hadoop.security.group.mapping.ldap.url":"ldap://172.31.93.167", "hadoop.security.group.mapping.ldap.bind.password":"Bind@User123", "hadoop.security.group.mapping.ldap.bind.user":"binduser@corp.emr.local", "hadoop.security.group.mapping.ldap.search.filter.group":"(objectclass=\*)"
>
> \},
>
> "configurations":\[
>
> \]
>
> \}
>
> \]
