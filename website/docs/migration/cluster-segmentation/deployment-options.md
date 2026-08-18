---
sidebar_label: How Deployment Options Affect Segmentation
---

# How Deployment Options Affect Segmentation

The segmentation patterns in this chapter assume EMR on EC2 clusters. However, two additional deployment options — EMR Serverless and EMR on EKS — can reduce or eliminate the need for cluster segmentation entirely. Before designing a multi-cluster topology, evaluate whether your workloads fit a deployment option that provides built-in isolation.

## Decision Framework

| **Segmentation Driver** | **EMR on EC2 (cluster segmentation)** | **EMR Serverless** | **EMR on EKS** |
|----|----|----|----|
| Workload isolation | Separate clusters per team/workload | Built-in: each application runs in its own isolated environment | Namespace-level isolation with pod resource limits |
| Security boundaries | Separate clusters with different IAM roles, security configs | Per-application IAM role; no shared cluster to compromise | Kubernetes RBAC + IAM Roles for Service Accounts (IRSA) |
| Resource contention | Separate clusters prevent noisy-neighbor effects | No contention: resources are provisioned per application | Resource quotas and limit ranges per namespace |
| Version/config differences | Different EMR releases or application configs per cluster | Per-application Spark/Hive version and configuration | Per-job Spark image and configuration |
| Cost attribution | Tag clusters per team; primary node overhead per cluster | Per-application billing with no idle cost | EKS namespace-level cost attribution; shared node pool |

## When EMR Serverless Eliminates Segmentation

EMR Serverless runs each application in a fully isolated, auto-scaling environment with no shared cluster infrastructure. This means:

**No cluster to segment** — Each StartJobRun call creates an isolated application execution with its own compute, memory, and IAM role.

**No noisy-neighbor risk** — Applications cannot contend for resources on a shared cluster.

**No primary node overhead** — Eliminates the cost of one primary node per cluster that EC2 segmentation incurs.

**Per-application IAM roles** — Security boundaries exist at the application level without requiring separate clusters.

**Use EMR Serverless instead of cluster segmentation when:**

Workloads are Spark or Hive batch jobs that don't require custom cluster configurations.

Teams need isolation for cost, security, or performance reasons but don't need interactive access or HBase.

You want to eliminate cluster lifecycle management entirely.

Workloads have variable or unpredictable schedules (no idle cluster cost).

**EMR Serverless is NOT a fit when:**

You need Apache HBase, Flink, or other frameworks not supported on Serverless.

Workloads require custom AMIs, bootstrap actions, or specific OS-level configurations.

You need sub-second job startup time (Serverless has cold-start latency unless pre-initialized capacity is configured).

Persistent interactive query engines (Trino) are required.

## When EMR on EKS Provides Isolation Without Segmentation

EMR on EKS runs Spark jobs as Kubernetes pods on an existing EKS cluster. Kubernetes-native isolation mechanisms replace the need for separate EMR clusters:

**Namespace isolation** — Each team or workload runs in its own Kubernetes namespace with resource quotas, network policies, and RBAC controls.

**Pod-level resource limits** — Prevent individual jobs from consuming more than their allocated CPU/memory without affecting other namespaces.

**IAM Roles for Service Accounts (IRSA)** — Each virtual cluster or job can assume a different IAM role without requiring a separate EMR cluster.

**Shared node pool efficiency** — A single EKS node pool serves multiple virtual clusters, improving utilization vs. separate EC2 primary nodes.

**Use EMR on EKS instead of cluster segmentation when:**

Your organization already operates EKS and wants to consolidate container workloads (Spark + microservices) on shared infrastructure.

You need Kubernetes-native isolation (network policies, pod security standards) rather than cluster-level boundaries.

Multiple teams run Spark workloads and you want shared node pools with per-namespace resource quotas.

**EMR on EKS is NOT a fit when:**

Teams don't have Kubernetes expertise or operational capacity.

You need frameworks beyond Spark (Hive, HBase, Flink, Trino) that aren't supported on EKS.

Your security model requires physical cluster-level isolation (some compliance frameworks mandate this).

## When EC2 Cluster Segmentation Is Still Required

Despite Serverless and EKS alternatives, EMR on EC2 with separate clusters remains the right approach when:

**Apache HBase serving workloads** — HBase requires persistent, long-running EC2 clusters with specific storage configurations.

**Multi-framework clusters** — Workloads requiring Spark + Hive + Trino + Flink on the same cluster with shared metastore access.

**Custom AMI or OS requirements** — Applications needing specific libraries, kernel modules, or OS-level configurations.

**Compliance-mandated physical isolation** — Regulatory requirements that demand separate infrastructure (not just logical isolation).

**Interactive query engines** — Persistent Trino or Hive LLAP clusters serving BI tools with connection pooling.

**HDFS-dependent workloads** — Jobs that require HDFS semantics (though migrating to S3 is recommended long-term).

For these scenarios, continue with the segmentation schemes described in the following sections.
