---
sidebar_label: Logging Architecture and Best Practices
---

# Logging Architecture and Best Practices

**Persistent Logging to Amazon S3**

Enable cluster-wide log archival to Amazon S3 for long-term retention and post-mortem analysis.

Configure S3 logging at cluster launch:

> aws emr create-cluster \\
> --release-label emr-7.12.0 \\
> --applications Name=Spark Name=Hadoop \\
> --log-uri s3://my-bucket/emr-logs/ \\
> --instance-type m5.xlarge \\
> --instance-count 3

**Log Types Archived to S3:**

- **Cluster Logs**: Bootstrap action logs, instance state logs, step logs

- **Application Logs**: YARN container logs, Spark driver/executor logs, Hadoop MapReduce logs

- **System Logs**: Syslog, dmesg, cloud-init logs

Logs are uploaded to S3 every 5 minutes and retained after cluster termination, enabling debugging of transient clusters.

**Real-Time Logging with CloudWatch Logs**

For real-time log analysis and alerting, configure EMR to stream logs to CloudWatch Logs.

Install CloudWatch agent via bootstrap script:

> \#!/bin/bash
> sudo yum install -y amazon-cloudwatch-agent
> sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
> -a fetch-config \\
> -m ec2 \\
> -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json \\
> -s

**CloudWatch Logs Use Cases:**

- **Real-time error detection:** Create metric filters to detect ERROR/FATAL log patterns

- **Application debugging:** Search and filter logs across all cluster nodes from a single interface

- **Compliance and auditing:** Centralized log retention with configurable retention policies
