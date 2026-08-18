---
sidebar_label: LDAP for Hue
---

# Example LDAP Configuration for Hue

| [ |
|---|
| \{ |
| "classification":"hue-ini", |
| "properties":\{ |
| \}, |
| "configurations":[ |
| \{ |
| "classification":"desktop", |
| "properties": \{ \}, |
| "configurations":[ |
| \{ |
| "classification":"auth", |
| "properties":\{ |
| "backend":"desktop.auth.backend.LdapBackend" |
| \}, |
| "configurations": [] |
| \}, |

| \{ |
|---|
| "classification":"ldap", |
| "properties":\{ |
| "bind_dn":"[binduser@corp.emr.local](mailto:binduser@corp.emr.local)", |
| "trace_level":"0", |
| "search_bind_authentication":"false", |
| "debug":"true", |
| "base_dn":"dc=corp,dc=emr,dc=local", |
| "bind_password":"Bind@User123", |
| "ignore_username_case":"true", |
| "create_users_on_login":"true", |
| "ldap_username_pattern":"uid=\<username>,cn=users,dc=corp,dc=emr,dc= |
| local", |
| "force_username_lowercase":"true", |
| "ldap_url":"ldap://172.31.93.167", |
| "nt_domain":"corp.emr.local" |
| \}, |
| "configurations":[ |
| \{ |
| "classification":"groups", |
| "properties":\{ |
| "group_filter":"objectclass=*", |
| "group_name_attr":"cn" |
| \}, |
| "configurations": [] \}, |
| \{ |
| "classification":"users", |
| "properties":\{ |
| "user_name_attr":"sAMAccountName", |
| "user_filter":"objectclass=*" |
| \}, |
| "configurations":[] |
| \} |
| ] |
| \} |
| ] |
| \} |
| ] |
| \} |
| ] |
