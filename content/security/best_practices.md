# ** 3 - Security **

Best Practices (BP) for running secure workloads on EMR. 

## ** BP 3.1 Encrypt Data at rest and in transit **

Properly protecting your data at rest and in transit using encryption is a core component of our well-architected pillar of security. Amazon EMR security configurations make it easy for you to encrypt data both at rest and in transit. A security configuration is like a template for encryption and other security configurations that you can apply to any cluster when you launch it.

For data at rest, EMR provides encryption options for reading and writing data in S3 via EMRFS. You specify Amazon S3 server-side encryption (SSE) or client-side encryption (CSE) as the Default encryption mode when you enable encryption at rest. Optionally, you can specify different encryption methods for individual buckets using Per bucket encryption overrides. EMR also provides the option to encrypt local disk storage. These are EC2 instance store volumes and the attached Amazon Elastic Block Store (EBS) storage that are provisioned with your cluster. You have the options of using linux Unified Key Setup (LUKS) encryption or using AWS KMS as your key provider.

For data in transit, EMR security configurations allows you you to either manually create PEM certificates, zip them in a file, and reference from Amazon S3 or implement a certificate custom provider in Java and specify the S3 path to the JAR. In either case, EMR automatically downloads artifacts to each node in the cluster and later uses them to implement the open-source, in-transit encryption features. For more information on how these certificates are used with different big data technologies, see: 
<https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-data-encryption-options.html#emr-encryption-intransit>

For more information about setting up security configurations in Amazon EMR, see the AWS Big Data Blog post Secure Amazon EMR with Encryption, see:
<https://aws.amazon.com/blogs/big-data/secure-amazon-emr-with-encryption>


## ** BP 3.2 Restrict network access to your EMR cluster and keep EMR block public access feature enabled **

Inbound and outbound network access to your EMR cluster is controlled by security groups. It is recommended to apply the principle of least privilege to your security groups. This is so that your cluster is locked down to only the applications or individuals who need access from the expected source IPs.

It’s also recommended to not allow SSH access to the hadoop user. The hadoop user has elevated sudo access and access to this user is typically not requred. EMR provides a number of ways for users to interact with clusters remotely. For job submission, users can use EMR Steps API or an orchestration service like Managed airflow or AWS Step functions. For Ad hoc or notebook use cases, you can use EMR studio or allow users to connect to the specific application portsports e.g Hiveserver2 JDBC, Livy or Notebook UI’s

The block public access feature prevents a cluster in a public subnet from launching when any security group associated with the cluster has a rule that allows inbound traffic from IPv4 0.0.0.0/0 or IPv6 ::/0 (public access) on a port, unless the port has been specified as an exception - port 22 is an exception by default.  This feature is enabled by default for each AWS Region in your AWS account and is not recommended to be turned off. 

Use Persistent Application UI's to remove the need to open firewall to get access to debugging UI

## ** BP 3.3 Provision clusters in a private subnet **

It is recommended to provision your EMR clusters in Private Subnets. Private subnets allow you to limit access to deployed components, and to control security and routing of the system. With a private subnet, you can enable communication with your own network over a VPN tunnel or AWS direct connect. This would allow you to access your EMR clusters from your network, without exposure to the internet. For access to other AWS services from your EMR Cluster e.g S3, VPC endpoints can be used.

For more information on configuring EMR clusters in private subnets or VPC endpoints, see:
<https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-vpc-subnet.html>
<https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html>

## ** BP 3.4 Configure EC2 instance metadata service (IMDS) v2 **

In AWS, Instance Metadata Service (IMDS) provides “data about your instance that you can use to configure or manage the running instance. Every instance has access to its own MDS using any HTTP client request, such as, curl command from the instance to http://169.254.169.254/latest/meta-data. IMDSv1 is fully secure and AWS will continue to support it. But IMDSv2 adds new “belt and suspenders” protections for four types of vulnerabilities that could be used to try to access the IMDS. For more see:
<https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/>

From EMR 5.32 and 6.2 onward, Amazon EMR components use IMDSv2 for all IMDS calls. For IMDS calls in your application code, you can use both IMDSv1 and IMDSv2. It is recommended to turn off IMDSv1 and only allow IMDSv2 for added security. This can be configured in EMR Security Configurations. For more information, see:
<https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-create-security-configuration.html#emr-security-configuration-imdsv2>

## ** BP 3.5 Create a separate IAM role for each cluster or use case **

EMR uses an IAM service roles to perform actions on your behalf to provision and manage clusters. It is recommended to create a separate IAM role for each use case and workload. This allows you to segregate access control between clusters. If you have multiple clusters, each cluster can only the services and data defined within the IAM policy. 

## ** BP 3.6 Use scoped down IAM policies for authorization such as AmazonEMRFullAccessPolicy_v2 **

EMR provides managed IAM policies to grant specific access privileges to users. Managed policies offer the benefit of updating automatically if permission requirements change. If you use inline policies, service changes may occur that cause permission errors to appear. 

It is recommended to use new managed policies (v2 policies) which have been scoped-down to align with AWS best practices. The v2 managed policies restrict access using tags. They allow only specified Amazon EMR actions and require cluster resources that are tagged with an EMR-specific key. For more details and usage, see:
<https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-managed-policy-fullaccess-v2.html>

## ** BP 3.7 Audit user activity with AWS CloudTrail **

AWS CloudTrail, a service that provides a record of actions taken by a user, role, or an AWS service, is integrated with Amazon EMR. CloudTrail captures all API calls for Amazon EMR as events. The calls captured include calls from the Amazon EMR console and code calls to the Amazon EMR API operations. If you create a trail, you can enable continuous delivery of CloudTrail events to an Amazon S3 bucket, including events for Amazon EMR.

You can also audit the S3 objects that EMR accesses by using S3 access logs. AWS CloudTrail provides logs only for AWS API calls. Thus, if a user runs a job that reads and writes data to S3, the S3 data that was accessed by EMR doesn’t show up in CloudTrail. By using S3 access logs, you can comprehensively monitor and audit access against your data in S3 from anywhere, including EMR.

Because you have full control over your EMR cluster, you can always install your own third-party agents or tooling. You do so by using bootstrap actions or custom AMIs to help support your auditing requirements.

## ** BP 3.8 Upgrade your EMR Releases frequently or use a Custom AMI to get the latest OS and application software patches **

Each Amazon EMR release version is "locked" to the Amazon Linux AMI version to maintain compatibility. This means that the same Amazon Linux AMI version is used for an Amazon EMR release version even when newer Amazon Linux AMIs become available. For this reason, we recommend that you use the latest Amazon EMR release version unless you need an earlier version for compatibility and are unable to migrate.

If you must use an earlier release version of Amazon EMR for compatibility, we recommend that you use the latest release in a series. For example, if you must use the 5.12 series, use 5.12.2 instead of 5.12.0 or 5.12.1. If a new release becomes available in a series, consider migrating your applications to the new release.


