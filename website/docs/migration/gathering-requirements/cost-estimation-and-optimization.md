---
sidebar_label: Cost Estimation and Optimization
---

# Cost Estimation and Optimization

Amazon EMR pricing depends on the deployment option you choose. With Amazon EMR on Amazon EC2, you pay a per-second rate that includes Amazon EMR and underlying Amazon EC2 and Amazon EBS costs. With Amazon EMR on Amazon EKS, you pay a per-second rate for the vCPU and memory your jobs use on top of your Amazon EKS costs. With Amazon EMR Serverless, you pay only for the vCPU, memory, and storage your applications consume while they run. For full pricing details, see [Amazon EMR pricing](https://aws.amazon.com/emr/pricing/).

## Estimating Your EMR Costs

To estimate your Amazon EMR costs, start with your on-premises cluster metrics and map them to the equivalent EMR resources for each deployment option.

| Deployment Option | Billing Model | Estimation Inputs |
|----|----|----|
| Amazon EMR on EC2 | EC2 instances + EMR service fee + EBS volumes (per node) | Instance family, node count per role (primary, core, task), runtime hours, storage volume |
| Amazon EMR on Amazon EKS | EC2 instances + EKS cluster fee + EMR service fee (per vCPU-hr and GB-hr) | vCPU and memory per pod, job runtime, node configuration |
| Amazon EMR Serverless | vCPU-hours + memory GB-hours + storage GB-hours | Worker size, worker count, runtime |

**Sizing persistent clusters**

> Size a persistent Amazon EMR on Amazon EC2 cluster by mapping your on-premises aggregate vCPU and memory to EMR node capacity:

- Aggregate compute and memory - Determine the average and peak aggregate vCPU and memory from your on-premises inventory.

- Performance adjustment - The Amazon EMR runtime for Apache Spark delivers better performance than open-source Spark on the same hardware. For conservative planning, assume you will need only 75% of your current average capacity. Validate the actual improvement through testing.

- vCPU-to-memory ratio - Matching your workload memory-to-compute profile to the right instance family ensures you're not paying for idle resources. Divide your cluster total average memory by total average vCPU to determine the ratio, then select the corresponding instance family:

  - 1:2 to 1:3 — compute-optimized (C-family);

  - 1:4 to 1:5 — general-purpose (M-family);

  - 1:6 to 1:8 — memory-optimized (R-family);

- Baseline and scaling — Size the baseline (primary and core nodes) to steady-state demand and let EMR managed scaling add task nodes for peaks.

The following example shows how to size a persistent cluster from on-premises metrics:

| **Input** | **Value** |
|---|---|
| On-premises aggregate (average) | 800 vCPU, 3,200 GB memory |
| On-premises aggregate (peak) | 1,000 vCPU, 4,000 GB memory |
| Performance adjustment | 75% |
| vCPU-to-memory ratio | 1:4 |
| Target instance family | M-family (general-purpose) |
| Persistent cluster sizing | Baseline =600 vCPU / 2,400 GB <br/>Managed scaling to 750 vCPU / 3,000 GB at peak |

> Once you select your target instance family, choose a specific instance size within that family for each node role. Core and task nodes typically use the same or similar sizes to deliver your required vCPU and memory, while the primary node can be smaller since it handles cluster management only. Each node role can be sized independently. For guidance on selecting compute resources and using managed scaling to optimize costs, see Optimizing Costs.
>
> The sizing above determines how much capacity you need. To estimate charges, calculate the number of nodes required based on the vCPU and memory per instance in your chosen family, then determine billable instance-hours for each node role.

| **Component** | **Calculation** | **Billable Units** |
|---|---|---|
| Core and Task node sizing | General-purpose instance: 48 vCPU, 192 GB memory | — |
| Primary nodes (HA) | 3 nodes × 730 hrs/mo | 2,190 instance-hours |
| Core nodes (baseline) | 600 vCPU ÷ 48 vCPU/node = <br/>13 nodes × 730 hrs/mo | 9,490 instance-hours |
| Task nodes (peak scaling) | 150 vCPU ÷ 48 vCPU/node = <br/>4 nodes × active hrs/mo | Varies by workload pattern |
| EBS storage | Provisioned GB per node × node count | GB-months |

> Each instance-hour incurs both an EC2 charge and an EMR service charge. Use the AWS Pricing Calculator to estimate charges for your configuration

### Estimating charges per job-based workloads

> Transient Amazon EMR on Amazon EC2 clusters, Amazon EMR on EKS, and Amazon EMR Serverless incur EMR charges only while a job runs. For each representative job, capture:

- vCPU and memory required - the resources the job needs to run.

- Runtime - how long the job runs end-to-end.

- Frequency - how many times per day, week, or month the job runs.

> Convert these inputs to monthly billable units. For transient EMR on EC2, apply the same cluster sizing from the persistent example; the cluster runs only for the job duration rather than 24×7. For EMR Serverless, refer to the Amazon EMR pricing page or AWS Pricing Calculator for current per-vCPU-hour and per-GB-hour rates, then multiply by your billable units to estimate monthly charges.
>
> Example, sizing a single job at 250 vCPU and 1,000 GB memory, running for 2 hours, 20 times per month:

| **Deployment model** | **Monthly billable unit** |
|----|----|
| Transient Amazon EMR on Amazon EC2 | 5 nodes × 2 hours × 20 runs = 200 instance-hours |
| Amazon EMR Serverless | 250 vCPU × 2 hours × 20 runs = 10,000 vCPU-hours; 1,000 GB × 2 hours × 20 runs = 40,000 GB-hours |
| Amazon EMR on EKS | 250 vCPU × 2 hours × 20 runs = 10,000 vCPU-hours; 1,000 GB × 2 hours × 20 runs = 40,000 GB-hours + EKS/EC2 infrastructure |

### Tools for estimation

> AWS provides tools that help calculate the costs based on the provided inputs:

- The AWS Pricing Calculator estimates costs for all three EMR deployment options. Use the values from your sizing exercise as inputs to generate a monthly estimate.

- The Amazon EMR Serverless cost estimator estimates Serverless workload costs based on worker configuration and runtime.
