---
sidebar_label: Common Customer Use Cases
---

# Common Customer Use Cases

## Production Cluster Baseline Configuration

The following configurations represent the recommended security posture that should be enabled on every production EMR cluster, regardless of workload type. Use-case-specific recommendations are covered in subsequent sections.

#### Networking

| Configuration | Requirement | Rationale |
|---|---|---|
| Private Subnet | Recommended | Cluster nodes must not be directly addressable from a public subnet. Place all instances in private subnets with no auto-assigned public IPs. |
| VPC Endpoints | Recommended | At minimum, deploy a gateway endpoint for S3. Add interface endpoints for services like KMS, STS, and CloudWatch as needed. |
| NAT Gateway | Optional | Only provision if workloads require outbound internet access (e.g., pulling packages from public repositories). If not needed, omit to reduce attack surface and cost. |

#### Encryption

| Configuration | Requirement | Rationale |
|---|---|---|
| In-transit encryption (TLS) | Recommended | Enable TLS for all inter-node communication and client-to-cluster connections. EMR security configurations support this natively via certificates. |
| At-rest encryption - EBS | Recommended | Encrypt all attached EBS volumes using AWS KMS. |
| At-rest encryption - S3 | Recommended | Enforce SSE-S3 or SSE-KMS on all S3 buckets used for input, output, and logs. Pair with bucket policies that deny unencrypted PutObject requests. |
| Nitro-based instances | Recommended | Nitro instances provide hardware-level encryption of data in transit between instances within the same VPC, adding defense-in-depth beyond application-layer TLS. |

#### Cluster Access

| Configuration | Requirement | Rationale |
|---|---|---|
| No SSH key pair | Recommended | Do not attach an EC2 key pair to cluster instances. This eliminates direct SSH as an access vector. |
| AWS Systems Manager (SSM) | Optional | Enable Session Manager access restricted to administrators only, and only when active troubleshooting is required. Enforce IAM policies that limit ssm:StartSession to a narrow set of principals and require tagging conditions. |
| Security group lockdown | Recommended | Restrict security groups to allow only intra-cluster traffic. Remove any rules permitting inbound access from 0.0.0.0/0 or broad CIDR ranges. |
| Web UI Access | Recommended | Use Live Application UIs accessible from EMR Web Console to monitor and debug active clusters or use persistent application UIs to debug terminated clusters. These UIs do not require direct network reachability to the cluster, leveraging EMR's managed proxy infrastructure to route traffic securely without the need for SSH tunnels, VPNs, or security group modifications. |

**Guiding principle**: Start with the most restrictive posture and open access only where a specific workload requirement demands it. Each relaxation should be documented, justified, and reviewed periodically.

## Batch analytics pipelines

Batch analytics pipelines on EMR are best orchestrated by submitting work as EMR Steps, which provide integration with orchestrators like Step Functions and MWAA. The security model for batch workloads depends on whether authorization is governed through AWS Lake Formation or IAM alone.

#### Job Submission

| Configuration | Requirement | Rationale |
|---|---|---|
| EMR Steps | Recommended | Preferred mechanism for submitting Spark and Hive batch jobs. Steps provide built-in lifecycle management, failure handling, and auditability via the EMR API and console. |

#### Security - Authorization with Lake Formation

Use this model when your data lake leverages Lake Formation for centralized permission management. Note that only Spark supports Lake Formation integration.

| Configuration | Requirement | Rationale |
|---|---|---|
| Runtime roles | **Required** | Decouple job-level permissions from the cluster's EC2 instance profile. Each Step executes with its own IAM role, enabling per-job least-privilege access. |
| [Lake Formation integration in Security Configuration](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-lf-enable.html) | Conditional | **Enable** when jobs require fine-grained access controls (column-level filters, row-level filters, cell-level security) on shared tables. |
| [Spark Full Table Access configuration](https://docs.aws.amazon.com/emr/latest/ManagementGuide/lake-formation-unfiltered-ec2-access.html) | Conditional | **Use instead of** Lake Formation integration in Security Configuration when tables are shared without fine-grained permissions. Configure needed spark settings at job submission. |

**Decision flow:**

- Are any tables to be accessed by the job shared with column/row filters? → Enable Lake Formation integration in the Security Configuration.

- All tables to be accessed by the job shared with full-table access only? → Disable Lake Formation integration; configure Spark Full Table Access spark settings at job submission.

#### Security - Authorization with IAM Only

Use this model when Lake Formation is not part of the architecture and access control is managed entirely through IAM policies — for example, granting permissions directly on Glue Data Catalog resources and S3 buckets. This approach is available for both Hive and Spark.

| Configuration | Requirement | Rationale |
|---|---|---|
| EC2 instance profile (single-tenant cluster) | **Sufficient** | When a cluster serves a single team or pipeline, the instance profile's IAM policies govern all resource access. This is the simplest model with no additional overhead. |
| Runtime roles (multi-tenant cluster) | **Recommended** | When a cluster is shared across teams or serves as a reusable template, Runtime Roles isolate each job's permissions. This prevents lateral access between tenants and supports per-job audit trails via CloudTrail. |

**Guiding principle:** Default to Runtime Roles unless you have a dedicated single-tenant cluster with no plans for shared use. The marginal setup cost is low compared to the blast radius of an overly permissive instance profile.

## Streaming Analytics Pipelines

Streaming workloads on EMR are long-running by nature. The suggested way to submit streaming processing jobs is through EMR Steps. The security model varies by engine.

#### Spark Streaming

####### Authorization with Lake Formation

| Configuration | Requirement | Rationale |
|---|---|---|
| Runtime roles | **Required** | Enables per-job IAM role isolation for streaming EMR Steps. |
| [Spark Full Table Access configuration](https://docs.aws.amazon.com/emr/latest/ManagementGuide/lake-formation-unfiltered-ec2-access.html) | **Required** | Only Full Table Access (FTA) mode is supported for streaming. Do *not* enable Lake Formation integration in the Security Configuration. Configure Full Table Access Spark settings at job submission. |
| Lake Formation integration in Security Configuration | **Do not enable** | Fine-grained Lake Formation access control is not supported for Spark Streaming workloads. |

####### Authorization with IAM Only

| Configuration | Requirement | Rationale |
|---|---|---|
| EC2 instance profile (single-tenant cluster) | **Sufficient** | When the cluster serves a single streaming application, the instance profile governs all resource access with no additional overhead. |
| Runtime roles (multi-tenant cluster) | **Required** | When multiple teams share a cluster or use a common cluster template, Runtime Roles isolate each job's permissions. |

#### Flink

| Configuration | Requirement | Rationale |
|---|---|---|
| EC2 instance profile | **Required** | Flink is not integrated with Runtime Roles or Lake Formation. The instance profile is the sole mechanism governing resource access for Flink jobs. |

## Interactive Analytics

Interactive analytics workloads on EMR involve users directly querying data through SQL engines or notebooks, where they submit queries and see results in real time. Because multiple users access the cluster concurrently with varying levels of permissions, the security model must address both user authentication and fine-grained access control at the query level.

#### Spark

| Configuration | Requirement | Rationale |
|---|---|---|
| Runtime roles | **Required** | Interactive notebooks are inherently multi-user. Runtime Roles ensure each user session operates with its own scoped IAM role. |
| [Lake Formation integration in Security Configuration](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-lf-enable.html) | Conditional | **Enable** when tables are shared with fine-grained permissions (column/row filters). |
| [Spark Full Table Access configuration](https://docs.aws.amazon.com/emr/latest/ManagementGuide/lake-formation-unfiltered-ec2-access.html) | Conditional | **Use instead of** Lake Formation integration in Security Configuration when tables are shared without fine-grained permissions. Configure needed Full Table Access spark settings at session creation. |
| Client tooling | **Recommended** | Use SageMaker Unified Studio (recommended), EMR Studio, or SageMaker AI Studio to connect to the cluster for an authorized managed notebook experience. |

#### Trino / Hive

Trino and Hive interactive endpoints are **not integrated** with Runtime Roles or Lake Formation.

####### AWS-Only Solution

| Configuration | Requirement | Rationale |
|---|---|---|
| [EMR Native LDAP integration](https://docs.aws.amazon.com/emr/latest/ManagementGuide/ldap.html) | **Required** | Provides user authentication for interactive query access. |
| Hue | **Recommended** | Use Hue as the query submission interface, integrated with LDAP for user identity. |
| Open-source access control | **Required** | Use engine-specific access control mechanisms to enforce per-user permissions: Hive SQL Authorization for Hive, and file-based access control for Trino. <br/>The EC2 instance profile must have IAM permissions that cover the superset of all data access required across users. The open-source access control layer then narrows each user's effective permissions down to their specific authorized subset. |

####### Partner Solution

| Configuration | Requirement | Rationale |
|---|---|---|
| [Privacera](https://docs.privacera.com/connectors/aws-emr/access/index.html) (Ranger) | Optional | Provides centralized fine-grained access control for Trino and Hive when a partner-based solution is acceptable. |

## HBase

HBase **is not integrated** with Runtime Roles or Lake Formation. The security model depends on the trust boundary of data producers and consumers.

| Scenario | Configuration | Rationale |
|---|---|---|
| Trusted, controlled ingestors | Network-level isolation | When all producers/consumers are known and trusted, restrict cluster access through security groups and subnet boundaries. |
| Untrusted or external clients | Kerberos Authentication | Enable Kerberos for authentication when clients cannot be controlled via networking alone. |
| Multi-source access with varying permissions | HBase ACLs | Configure HBase ACLs for fine-grained authorization to control which authenticated users can access specific tables, column families, or cells. |
| HBase on S3 | EC2 instance profile with S3 access | The instance profile must have IAM permissions to the HBase root S3 location for StoreFile reads/writes. |
