---
sidebar_label: Network Security
---

# Network Security

This section covers network-level best practices for Amazon EMR clusters. For foundational guidance on setting up VPCs, subnets, security groups, and network ACLs, see [Configure networking in a VPC for Amazon EMR](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-vpc-subnet.html) and [Control network traffic with security groups](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-security-groups.html) in the *Amazon EMR Management Guide*.

## Best Practices for Network Security

**Use private subnets for production clusters.** Launching clusters in a private subnet is always a good practice, especially for production workloads. Add a gateway VPC endpoint for Amazon S3 and interface VPC endpoints for any other required AWS services (e.g., AWS KMS, Amazon CloudWatch, AWS STS). For more information, see [Amazon VPC options](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-clusters-in-a-vpc.html) in the *Amazon EMR Management Guide*.

**Use a NAT gateway for outbound internet access from private subnets.** If your cluster is in a private subnet but requires access to an AWS service that does not have a VPC endpoint, or requires outbound internet access, route traffic through a NAT gateway in a public subnet. For more information, see [VPC with public and private subnets (NAT)](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html) in the *Amazon VPC User Guide*.

**Use a proxy server when NAT or internet gateways are not permitted.** If your organization does not allow NAT gateways or internet gateways, you can configure a proxy server to handle outbound connectivity. You can configure a proxy using the following script.

> AWS_REGION="YOUR_AWS_REGION" \# replace with your cluster region
>
> PROXY_HOST="YOUR_PROXY_HOSTNAME" \# replace with your proxy’s hostname or ip
>
> http_proxy="http://\$\{PROXY_HOST\}/"
>
> https_proxy="https://\$\{PROXY_HOST\}/"
>
> no_proxy="127.0.0.1,localhost,169.254.169.254,\*.s3.\$\{AWS_REGION\}.amazonaws.com,.s3.\$\{AWS_REGION\}.amazonaws.com,s3.\$\{AWS_REGION\}.amazonaws.com,\*.s3.amazonaws.com,.s3.amazonaws.com,s3.amazonaws.com,.s3.dualstack.\$\{AWS_REGION\}.amazonaws.com,.amazonaws.com"
>
> echo "http_proxy=\$http_proxy" \>\> /etc/environment
>
> echo "https_proxy=\$https_proxy" \>\> /etc/environment
>
> echo "no_proxy=\$no_proxy" \>\> /etc/environment
>
> echo "export http_proxy=\$http_proxy" \>\> /etc/profile.d/http_proxy.sh
>
> echo "export https_proxy=\$https_proxy" \>\> /etc/profile.d/http_proxy.sh
>
> echo "export no_proxy=\$no_proxy" \>\> /etc/profile.d/http_proxy.sh

When setting the NO_PROXY variable make sure to follow the following best practice:

- Include both wildcard (\*.domain.com) and leading-dot (.domain.com) formats, since different tools interpret them differently.

- **169.254.169.254** must be in no_proxy to prevent IMDS and IAM role credential requests from being routed through the corporate proxy.

- Add regional S3 domains to no_proxy to keep S3 traffic off the corporate proxy, which can throttle throughput and degrade cluster performance. Adjust if you use S3 VPC endpoints.

- For **HTTPS** proxies make sure to import correct TLS certificates on the EMR nodes

- Add all AWS services reachable via VPC endpoints to no_proxy.

**Apply restrictive policies to S3 VPC endpoints.** When you create a gateway VPC endpoint for Amazon S3, attach a restrictive endpoint policy that limits access to only the S3 buckets your cluster requires — for example, the buckets used for input data, output data, EMR logs, and EMR system artifacts. For sample endpoint policies, see [Sample policies for private subnets that access Amazon S3](https://docs.aws.amazon.com/emr/latest/ManagementGuide/private-subnet-iampolicy.html) in the *Amazon EMR Management Guide*.

**Eliminate SSH access for non-interactive clusters.** If your cluster does not require interactive access, do not open port 22 in the cluster security groups. This reduces the attack surface and simplifies security group management. If direct access to cluster nodes is occasionally needed for debugging or maintenance, use [AWS Systems Manager (SSM) Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html) instead of SSH. SSM Session Manager provides shell access without requiring open inbound ports, bastion hosts, or SSH key management, and it logs all session activity to Amazon CloudWatch Logs or Amazon S3 for auditing.

**Enable block public access.** Block public access (BPA) prevents cluster creation when any associated security group has an inbound rule that allows traffic from 0.0.0.0/0 or ::/0 on a port not listed as an exception. BPA is enabled by default for all clusters in every AWS Region. It applies across the entire lifecycle of a cluster — if a user modifies a security group on a running cluster to allow public access, Amazon EMR revokes the rule if it has permission to do so, or creates an event in the AWS Health dashboard describing the violation. Port 22 is an exception by default. You can configure additional exceptions, but remove them as soon as they are no longer needed. We recommend keeping BPA enabled at all times. For more information, see [Using Amazon EMR block public access](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-block-public-access.html) in the *Amazon EMR Management Guide*.
