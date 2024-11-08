"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[2297],{7495:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>n,default:()=>d,frontMatter:()=>r,metadata:()=>i,toc:()=>l});var a=s(4848),o=s(8453);const r={sidebar_position:2,sidebar_label:"Best Practices"},n="3 - Security",i={id:"bestpractices/Security/best_practices",title:"3 - Security",description:"Best Practices (BP) for running secure workloads on EMR.",source:"@site/docs/bestpractices/3 - Security/best_practices.md",sourceDirName:"bestpractices/3 - Security",slug:"/bestpractices/Security/best_practices",permalink:"/aws-emr-best-practices/docs/bestpractices/Security/best_practices",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/bestpractices/3 - Security/best_practices.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,sidebar_label:"Best Practices"},sidebar:"bestpractices",previous:{title:"Introduction",permalink:"/aws-emr-best-practices/docs/bestpractices/Security/introduction"},next:{title:"Best Practices",permalink:"/aws-emr-best-practices/docs/bestpractices/Features/EMRFS/best_practices"}},c={},l=[{value:"BP 3.1 Encrypt Data at rest and in transit",id:"bp-31-encrypt-data-at-rest-and-in-transit",level:2},{value:"BP 3.2 Restrict network access to your EMR cluster and keep EMR block public access feature enabled",id:"bp-32-restrict-network-access-to-your-emr-cluster-and-keep-emr-block-public-access-feature-enabled",level:2},{value:"BP 3.3 Provision clusters in a private subnet",id:"bp-33-provision-clusters-in-a-private-subnet",level:2},{value:"BP 3.4 Configure EC2 instance metadata service (IMDS) v2",id:"bp-34-configure-ec2-instance-metadata-service-imds-v2",level:2},{value:"BP 3.5 Create a separate IAM role for each cluster or use case",id:"bp-35-create-a-separate-iam-role-for-each-cluster-or-use-case",level:2},{value:"BP 3.6 Use scoped down IAM policies for authorization such as AmazonEMRFullAccessPolicy_v2",id:"bp-36-use-scoped-down-iam-policies-for-authorization-such-as-amazonemrfullaccesspolicy_v2",level:2},{value:"BP 3.7 Audit user activity with AWS CloudTrail",id:"bp-37-audit-user-activity-with-aws-cloudtrail",level:2},{value:"BP 3.8 Upgrade your EMR Releases frequently or use a Custom AMI to get the latest OS and application software patches",id:"bp-38-upgrade-your-emr-releases-frequently-or-use-a-custom-ami-to-get-the-latest-os-and-application-software-patches",level:2}];function u(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",...(0,o.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.header,{children:(0,a.jsx)(t.h1,{id:"3---security",children:"3 - Security"})}),"\n",(0,a.jsx)(t.p,{children:"Best Practices (BP) for running secure workloads on EMR."}),"\n",(0,a.jsx)(t.h2,{id:"bp-31-encrypt-data-at-rest-and-in-transit",children:"BP 3.1 Encrypt Data at rest and in transit"}),"\n",(0,a.jsx)(t.p,{children:"Properly protecting your data at rest and in transit using encryption is a core component of AWS' Well-Architected pillar of security. Amazon EMR security configurations make it easy for you to encrypt data both at rest and in transit. A security configuration is like a template for encryption and other security configurations that you can apply to any cluster when you launch it."}),"\n",(0,a.jsx)(t.p,{children:"For data at rest, EMR provides encryption options for reading and writing data in S3 via EMRFS. You specify Amazon S3 server-side encryption (SSE) or client-side encryption (CSE) as the Default encryption mode when you enable encryption at rest. Optionally, you can specify different encryption methods for individual buckets using Per bucket encryption overrides. EMR also provides the option to encrypt local disk storage. These are EC2 instance store volumes and the attached Amazon Elastic Block Store (EBS) storage that are provisioned with your cluster. You have the options of using Linux Unified Key Setup (LUKS) encryption or using AWS KMS as your key provider."}),"\n",(0,a.jsxs)(t.p,{children:["For data in transit, EMR security configurations allow you to either manually create PEM certificates, zip them in a file, and reference from Amazon S3 or implement a certificate custom provider in Java and specify the S3 path to the JAR. In either case, EMR automatically downloads artifacts to each node in the cluster and later uses them to implement the open-source, in-transit encryption features. For more information on how these certificates are used with different big data technologies, see:\n(",(0,a.jsx)(t.a,{href:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-data-encryption-options.html#emr-encryption-intransit",children:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-data-encryption-options.html#emr-encryption-intransit"}),")"]}),"\n",(0,a.jsxs)(t.p,{children:["For more information about setting up security configurations in Amazon EMR, see the AWS Big Data Blog post Secure Amazon EMR with Encryption, see: (",(0,a.jsx)(t.a,{href:"https://aws.amazon.com/blogs/big-data/secure-amazon-emr-with-encryption",children:"https://aws.amazon.com/blogs/big-data/secure-amazon-emr-with-encryption"}),")"]}),"\n",(0,a.jsx)(t.h2,{id:"bp-32-restrict-network-access-to-your-emr-cluster-and-keep-emr-block-public-access-feature-enabled",children:"BP 3.2 Restrict network access to your EMR cluster and keep EMR block public access feature enabled"}),"\n",(0,a.jsx)(t.p,{children:"Inbound and outbound network access to your EMR cluster is controlled by EC2 Security Groups. It is recommended to apply the principle of least privilege to your Security Groups, so that your cluster is locked down to only the applications or individuals who need access from the expected source IPs."}),"\n",(0,a.jsxs)(t.p,{children:["It\u2019s also recommended to not allow SSH access to the ",(0,a.jsx)(t.code,{children:"hadoop"})," user, which has elevated sudo access and access to this user is typically not required. EMR provides a number of ways for users to interact with clusters remotely. For job submission, users can use EMR Steps API or an orchestration service like AWS Managed Apache Airflow or AWS Step functions. For ad-hoc or notebook use cases, you can use EMR Studio, or allow users to connect to the specific application ports e.g Hiveserver2 JDBC, Livy or Notebook UI\u2019s."]}),"\n",(0,a.jsx)(t.p,{children:"The block public access feature prevents a cluster in a public subnet from launching when any security group associated with the cluster has a rule that allows inbound traffic from IPv4 0.0.0.0/0 or IPv6 ::/0 (public access) on a port, unless the port has been specified as an exception - port 22 is an exception by default.  This feature is enabled by default for each AWS Region in your AWS account and is not recommended to be turned off."}),"\n",(0,a.jsx)(t.p,{children:"Use Persistent Application UI's to remove the need to open firewall to get access to debugging UI"}),"\n",(0,a.jsx)(t.h2,{id:"bp-33-provision-clusters-in-a-private-subnet",children:"BP 3.3 Provision clusters in a private subnet"}),"\n",(0,a.jsx)(t.p,{children:"It is recommended to provision your EMR clusters in Private VPC Subnets. Private Subnets allow you to limit access to deployed components, and to control security and routing of the system. With a private Subnet, you can enable communication with your own network over a VPN tunnel or AWS Direct Connect, which allows you to access your EMR clusters from your network without requiring internet routing. For access to other AWS services from your EMR Cluster e.g S3, VPC endpoints can be used."}),"\n",(0,a.jsxs)(t.p,{children:["For more information on configuring EMR clusters in private subnets or VPC endpoints, see:\n(",(0,a.jsx)(t.a,{href:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-vpc-subnet.html",children:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-vpc-subnet.html"}),")\n(",(0,a.jsx)(t.a,{href:"https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html",children:"https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html"}),")"]}),"\n",(0,a.jsx)(t.h2,{id:"bp-34-configure-ec2-instance-metadata-service-imds-v2",children:"BP 3.4 Configure EC2 instance metadata service (IMDS) v2"}),"\n",(0,a.jsxs)(t.p,{children:["In AWS EC2, the Instance Metadata Service (IMDS) provides \u201cdata about your instance that you can use to configure or manage the running instance. Every instance has access to its own IMDS using any HTTP client request (such as the ",(0,a.jsx)(t.code,{children:"curl"})," command) located at ",(0,a.jsx)(t.code,{children:"http://169.254.169.254/latest/meta-data"}),". IMDSv1 is fully secure and AWS will continue to support it, but IMDSv2 adds new \u201cbelt and braces\u201d protections for four types of vulnerabilities that could be used to try to access the IMDS. For more see:\n(",(0,a.jsx)(t.a,{href:"https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/",children:"https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/"}),")"]}),"\n",(0,a.jsxs)(t.p,{children:["From EMR 5.32 and 6.2 onward, Amazon EMR components use IMDSv2 for all IMDS calls. For IMDS calls in your application code, you can use both IMDSv1 or IMDSv2. It is recommended to turn off IMDSv1 and only allow IMDSv2 for added security. This can be configured in EMR Security Configurations. For more information, see:\n",(0,a.jsx)(t.a,{href:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-create-security-configuration.html#emr-security-configuration-imdsv2",children:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-create-security-configuration.html#emr-security-configuration-imdsv2"}),")"]}),"\n",(0,a.jsx)(t.h2,{id:"bp-35-create-a-separate-iam-role-for-each-cluster-or-use-case",children:"BP 3.5 Create a separate IAM role for each cluster or use case"}),"\n",(0,a.jsx)(t.p,{children:"EMR uses an IAM service Roles to perform actions on your behalf to provision and manage clusters. It is recommended to create a separate IAM Role for each use case and workload, allowing you to segregate access control between clusters. If you have multiple clusters, each cluster can only access the services and data defined within the IAM policy."}),"\n",(0,a.jsx)(t.h2,{id:"bp-36-use-scoped-down-iam-policies-for-authorization-such-as-amazonemrfullaccesspolicy_v2",children:"BP 3.6 Use scoped down IAM policies for authorization such as AmazonEMRFullAccessPolicy_v2"}),"\n",(0,a.jsx)(t.p,{children:"EMR provides managed IAM policies to grant specific access privileges to users. Managed policies offer the benefit of updating automatically if permission requirements change. If you use inline policies, service changes may occur that cause permission errors to appear."}),"\n",(0,a.jsxs)(t.p,{children:["It is recommended to use new managed policies (v2 policies) which have been scoped-down to align with AWS best practices. The v2 managed policies restrict access using tags. They allow only specified Amazon EMR actions and require cluster resources that are tagged with an EMR-specific key. For more details and usage, see:\n(",(0,a.jsx)(t.a,{href:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-managed-policy-fullaccess-v2.html",children:"https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-managed-policy-fullaccess-v2.html"}),")"]}),"\n",(0,a.jsx)(t.h2,{id:"bp-37-audit-user-activity-with-aws-cloudtrail",children:"BP 3.7 Audit user activity with AWS CloudTrail"}),"\n",(0,a.jsx)(t.p,{children:"AWS CloudTrail provides a record of actions taken by a user, role, or an AWS service, and is integrated with Amazon EMR. CloudTrail captures all API calls for Amazon EMR as events, which includes calls from the Amazon EMR console or calls to the Amazon EMR API. If you create a Trail, you can enable continuous delivery of CloudTrail events to an Amazon S3 bucket, including events for Amazon EMR."}),"\n",(0,a.jsx)(t.p,{children:"You can also audit the S3 objects that EMR accesses by using S3 access logs. AWS CloudTrail provides logs only for AWS API calls. Thus, if a user runs a job that reads and writes data to S3, the S3 data that was accessed by EMR doesn\u2019t show up in CloudTrail. By using S3 access logs, you can comprehensively monitor and audit access against your data in S3 from anywhere, including EMR."}),"\n",(0,a.jsx)(t.p,{children:"Because you have full control over your EMR cluster, you can always install your own third-party agents or tooling. You do so by using bootstrap actions or custom AMIs to help support your auditing requirements."}),"\n",(0,a.jsx)(t.h2,{id:"bp-38-upgrade-your-emr-releases-frequently-or-use-a-custom-ami-to-get-the-latest-os-and-application-software-patches",children:"BP 3.8 Upgrade your EMR Releases frequently or use a Custom AMI to get the latest OS and application software patches"}),"\n",(0,a.jsx)(t.p,{children:'Each Amazon EMR release version is "locked" to the Amazon Linux AMI version to maintain compatibility. This means that the same Amazon Linux AMI version is used for an Amazon EMR release version even when newer Amazon Linux AMIs become available. For this reason, we recommend that you use the latest Amazon EMR release version unless you need an earlier version for compatibility and are unable to migrate.'}),"\n",(0,a.jsx)(t.p,{children:"If you must use an earlier release version of Amazon EMR for compatibility, we recommend that you use the latest release in a series. For example, if you must use the 5.12 series, use 5.12.2 instead of 5.12.0 or 5.12.1. If a new release becomes available in a series, consider migrating your applications to the new release."})]})}function d(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(u,{...e})}):u(e)}},8453:(e,t,s)=>{s.d(t,{R:()=>n,x:()=>i});var a=s(6540);const o={},r=a.createContext(o);function n(e){const t=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:n(e.components),a.createElement(r.Provider,{value:t},e.children)}}}]);