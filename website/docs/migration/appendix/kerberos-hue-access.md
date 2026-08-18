---
sidebar_label: Kerberos Flow Through Hue
---

# EMR Kerberos Flow Through Hue Access

![](/img/migration/image37.png)

> *Figure 51: EMR Kerberos Flow through Hue access*

1.  The user logs into Hue (or Zeppelin) with their on-premises credentials.

2.  Hue authenticates those credentials against on-premises Active Directory via LDAP(S).

3.  Once authenticated, the user submits a Hive query through the Hue interface.

4.  Hue forwards the query to HiveServer2 and instructs it to run the job as the user (impersonation).

5.  HiveServer2 submits the job to the Resource Manager for processing.

6.  During execution, Hadoop authenticates and authorizes the user by invoking SSSD to verify the user account on the local node.
