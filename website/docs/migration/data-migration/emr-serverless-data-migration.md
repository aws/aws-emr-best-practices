---
sidebar_label: EMR Serverless for Data Migration ✨
---

# Running Data Migration Workloads on AWS

Once data lands in Amazon S3, you typically need to transform, repartition, and optimize it for the target analytics environment. These migration processing jobs — format conversion, CDC merges, streaming ingestion, and validation — can run on any of several AWS compute engines.

**Compute engine options:**

• EMR Serverless — Best for most migration workloads with no infrastructure to manage and automatic scaling. Pay per vCPU-second.

• EMR on EC2 — Best for long-running migrations, workloads requiring HDFS or custom AMIs, and teams needing persistent clusters with notebooks.

• EMR on EKS — Best for teams already running Kubernetes who want to consolidate compute with rapid pod-based job submission.

• AWS Glue — Best for catalog-centric ETL, visual job authoring, and teams preferring a managed experience with minimal Spark configuration.

**Our recommendation: Start with EMR Serverless for data migration workloads. It requires no infrastructure decisions upfront, scales automatically with variable demand patterns typical of migrations (burst for bulk loads, steady for CDC, idle during quiet periods), and you pay only for compute consumed. Move to EMR on EC2 or EMR on EKS only if you need persistent clusters, custom environments, or Kubernetes-native orchestration.**

The same Spark scripts run on any engine with only deployment-specific changes — the data migration logic is identical across compute options.
