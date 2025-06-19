---
sidebar_position: 1
sidebar_label: Introduction
---

# CloudWatch

Amazon EMR automatically publishes a set of free metrics to CloudWatch every five minutes to help monitor cluster activity and health.


## Cloudwatch Agent

Starting with Amazon EMR Release 7.0, you can install the Amazon CloudWatch Agent to publish 34 additional paid metrics to CloudWatch every minute. The agent collects metrics from all nodes in the cluster, aggregates them on the primary node, and publishes the data to the cloud. You can view these metrics in the EMR console under the Monitoring tab or in the CloudWatch Console.

By analyzing these metrics, you can gain valuable insights into whether your cluster could perform more efficiently with different instance families or if it’s possible to reduce the cluster size without compromising performance.

With Amazon EMR 7.1, you can configure the agent to send additional metrics - Hadoop, YARN and Hbase, offering deeper visibility into your cluster’s performance. Also, if you are using Prometheus to monitor your enterprise metrics, you can opt to send these metrics to an Amazon Managed Service for Prometheus endpoint.

CloudWatchAgent is supported on Runtime Role Clusters for EMR 7.6 and higher.

You can install the agent when creating a new cluster via the console or the create-cluster API. For more details, refer to "Create an EMR cluster that uses Amazon CloudWatch agent.

**Limitations of Large EMR on EC2 Clusters:**
The CloudWatch GetMetricData API supports up to 500 metrics per request. If your EMR cluster has more than 250 nodes in an instance group or fleet, the corresponding graphs in the CloudWatch embedded dashboard in EMR will display a "Too many metrics" error and appear blank. This is because these metrics require two data points per metric in the "Cluster Overview" dashboard. However, by filtering the Core or Task Instance Group/fleet dashboards, you can view graphs for up to 500 nodes per instance group or fleet, as these dashboards don’t require two data points per metric. For instance groups or fleets with more than 500 nodes, the "Too many metrics" error will also occur for the metrics in these dashboards.

In this case, we recommend using CloudWatch Metrics Insights. A single query in Metrics Insights can return up to 500 time series. If the query results exceed this limit, not all metrics will be included. However, with the ORDER BY clause, the metrics are sorted, and the top 500 metrics based on the specified criteria are returned. This approach is still useful because it can handle up to 10,000 metrics, and the ORDER BY clause allows you to control which 500 metrics are returned.

The only limitation is that CloudWatch Metrics Insights currently only allows data from the last 3 hours.
