---
sidebar_label: Migration Considerations and Best Practices
---

# Observability: Migration Considerations and Best Practices

## Migration Considerations from On-Premises

When transitioning from on-premises monitoring tools to AWS:

**Replace Ganglia:**

- **Ganglia** was the default monitoring tool for on-premises Hadoop clusters

- **Migration Path**: Replace with CloudWatch for basic metrics + Grafana for advanced dashboards

- **Benefit**: Managed service eliminates need to maintain Ganglia infrastructure

**Replace Nagios/Zabbix:**

- **On-Premises**: Custom scripts and agents for alerting

- **AWS Alternative**: CloudWatch Alarms with SNS notifications

- **Benefit**: Native integration with EMR metrics, no agent installation required

**Centralize Logging:**

- **On-Premises**: Logs scattered across cluster nodes, difficult to aggregate

- **AWS Alternative**: S3 for persistent storage + CloudWatch Logs for real-time analysis

- **Benefit**: Logs survive cluster termination, searchable across all nodes

**Unified Dashboards:**

- **Challenge**: On-premises environments often have separate dashboards for YARN, HDFS, Spark, HBase

- **AWS Solution**: Amazon Managed Grafana with unified dashboards across all EMR applications

- **Benefit**: Single pane of glass for multi-cluster, multi-application observability

## Performance Optimization Tools

**AWS EMR Advisor:** EMR Advisor is an open-source tool from https://github.com/aws-samples/aws-emr-advisor that analyzes Spark event logs to provide tailored recommendations for cluster configurations, performance tuning, and cost reduction. Clone the repository and run it against your Spark event logs stored in Amazon S3. It is not a native EMR console feature.

**Amazon CodeGuru Profiler:**

Identifies performance bottlenecks and inefficiencies in Spark applications through runtime data analysis.

Integration steps:

1.  Add CodeGuru Profiler agent to Spark application JARs

2.  Configure profiling group in CodeGuru console

3.  Analyze flame graphs and recommendations for CPU/memory optimization

## Best Practices Summary

- **Enable persistent logging to S3** for all production clusters to support post-mortem analysis

- **Set up CloudWatch alarms** for critical metrics: IsIdle, MRUnhealthyNodes, HDFSUtilization, AppsFailed

- **Use managed services (Managed Prometheus/Grafana)** to reduce operational overhead compared to self-hosted solutions

- **Implement unified dashboards** for monitoring multiple clusters and applications from a single interface

- **Leverage EMR-managed scaling** with CloudWatch metrics for automatic cluster resizing based on workload demand

- **Configure log retention policies** in CloudWatch Logs to balance cost and compliance requirements

- **Use Spark History Server** with S3 storage for long-term Spark application analysis

- **Monitor YARN queue utilization** to optimize resource allocation across multi-tenant workloads

## Documentation and Resources

**AWS Official Documentation:**

- [EMR Observability Best Practices](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-metrics-observability.html)

- [Monitoring EMR Metrics with CloudWatch](https://docs.aws.amazon.com/emr/latest/ManagementGuide/UsingEMR_ViewingMetrics.html)

- [Configure Amazon EMR Cluster Logging](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-debugging.html)

**AWS Blogs:**

- [How FINRA established real-time operational observability for Amazon EMR](https://aws.amazon.com/blogs/big-data/how-finra-established-real-time-operational-observability-for-amazon-emr-big-data-workloads-on-amazon-ec2-with-prometheus-and-grafana/)

- [Monitor and Optimize Analytic Workloads on Amazon EMR with Prometheus and Grafana](https://aws.amazon.com/blogs/big-data/monitor-and-optimize-analytic-workloads-on-amazon-emr-with-prometheus-and-grafana/)

- [Monitor Apache Spark applications on Amazon EMR with Amazon CloudWatch](https://aws.amazon.com/blogs/big-data/monitor-apache-spark-applications-on-amazon-emr-with-amazon-cloudwatch/)

**AWS Workshops:**

- [Observability for EMR Clusters Workshop](https://catalog.us-east-1.prod.workshops.aws/workshops/06e0fca9-b0c4-4ff8-add5-4f27b55aadab)
