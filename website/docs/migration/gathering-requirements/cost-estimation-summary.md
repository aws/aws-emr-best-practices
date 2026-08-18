---
sidebar_label: Cost Estimation Summary
---

# Cost Estimation Summary

Cost components depend on the EMR deployment option you choose:

- Amazon EMR on Amazon EC2: Amazon EMR cost, Amazon EC2 instance cost, and Amazon EBS volume cost (if using EBS).

- Amazon EMR on Amazon EKS: Amazon EMR cost (billed on vCPU and memory per pod), Amazon EKS cluster cost, and the underlying Amazon EC2 instance cost for worker nodes.

- Amazon EMR Serverless: vCPU-hour, memory-GB-hour, and storage-GB-hour costs.

Due to the per-second pricing of Amazon EMR, the cost of running a large EMR cluster that runs for a short duration would be similar to the cost of running a small cluster for a longer duration. For example, a 10-node cluster running for 10 hours costs the same as a 100-node cluster running for 1 hour. The hourly rate depends on the instance type used (such as standard, high CPU, high memory, high storage, etc.). For detailed pricing information, see [\<u>Amazon EMR Pricing\</u>.](https://aws.amazon.com/emr/pricing/)
