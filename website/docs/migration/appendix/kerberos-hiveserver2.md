---
sidebar_label: Kerberos with HiveServer2
---

# EMR Kerberos Flow for Directly Interacting with HiveServer2

![](/img/migration/image38.png)

> *Figure 52: EMR Kerberos flow for directly interacting with HiveServer2*

- The user SSHs into the primary node and authenticates with their credentials.

- To obtain a Kerberos ticket, the user runs kinit against the local KDC: kinit -k -t \<keytab\> \<principal\>

- The local KDC delegates authentication to the on-premises KDC and returns a ticket to the user.

- The user submits a query to HiveServer2, presenting the Kerberos ticket for authentication.

- HiveServer2 requests the local KDC to validate the ticket.

- The local KDC forwards the validation request to the on-premises KDC.

- HiveServer2 submits the job to the Resource Manager, running it as the authenticated user.

- During execution, Hadoop uses SSSD to authenticate and authorize the user account on the local node.
