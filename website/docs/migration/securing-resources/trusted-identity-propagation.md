---
sidebar_label: Migrating to EMR Trusted Identity Propagation
---

# Migrating to EMR Trusted Identity Propagation

This section outlines the migration path from Cloudera KnoxSSO and Cloudera Identity Federation to AWS EMR Trusted Identity Propagation. The key conceptual shift is: Cloudera KnoxSSO (a gateway-based SSO proxy that brokers authentication to Hadoop services) is replaced by AWS IAM Identity Center + Trusted Identity Propagation, which natively propagates corporate identities across AWS analytics services via OAuth tokens rather than a gateway proxy.

AWS IAM Identity Center (IDC) is the centralized identity service that manages workforce users and groups across AWS accounts. Trusted Identity Propagation (TIP) is the mechanism by which a user’s identity — authenticated via Identity Center — is automatically passed along (propagated) from the entry-point application (e.g., EMR Studio) through to downstream AWS services (e.g., Lake Formation, S3 Access Grants), enabling fine-grained, user-level authorization without per-service credential management.

## Supported and Unsupported EMR Applications

TIP support on EMR is currently limited to specific applications and modes:

Supported: Apache Spark (interactive sessions only via Livy endpoint). On EMR on EC2, requires release 6.15.0+ for table-level Lake Formation permissions and 7.2.0+ for fine-grained (row/column/cell-level). On EMR Serverless, requires release 7.8.0+.

Not supported: Apache Hive, Trino/PrestoSQL, Apache HBase, Apache Flink, Apache Oozie, Pig, Phoenix, and all other EMR applications do not support TIP.

## Supported Deployment Options

TIP support varies by EMR deployment mode:

EMR on EC2 — Fully supported (release 6.15.0+). Apache Spark interactive sessions only (via EMR Studio and SageMaker Unified Studio). Lake Formation fine-grained access (row/column/cell) on 7.2.0+; table-level only on 6.15–7.1.

EMR Serverless — Supported (release 7.8.0+). Apache Spark interactive workloads via Livy endpoint only (SageMaker Unified Studio). Batch jobs and streaming do NOT support TIP.

***Note:** TIP for EMR Serverless currently requires the Livy endpoint. Spark Connect–based interactive sessions from SMUS do not yet propagate identity. Check the EMR Serverless TIP documentation for updates on Spark Connect support.*

EMR on EKS — Apache Spark interactive workloads supported via SageMaker Unified Studio. Requires attaching an inline IAM policy with sso-oauth actions (CreateTokenWithIAM, IntrospectTokenWithIAM, RevokeTokenWithIAM) to the EMR on EKS system namespace role.

## Phase 1: Set Up AWS IAM Identity Center

IAM Identity Center replaces the KnoxSSO provider configuration (SAML/OIDC to LDAP/AD) and Cloudera User Management Service (UMS). For a full overview, see [Integrate Amazon EMR with AWS IAM Identity Center](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-idc.html).

Steps:

- Enable IAM Identity Center in your chosen AWS Region.

- Connect your existing Identity Provider (Okta, Azure Entra ID / AD, Ping Identity, etc.) — the same IdP you currently federate through KnoxSSO.

- Sync users and groups via SCIM provisioning from your IdP into IAM Identity Center.

- Verify SSO login works via the AWS Access Portal.

For more information, see [IAM Identity Center identity source tutorials](https://docs.aws.amazon.com/singlesignon/latest/userguide/tutorials.html) in the AWS IAM Identity Center User Guide.

## Phase 2: Configure AWS Lake Formation

Lake Formation replaces Apache Ranger / Sentry authorization policies. Ranger group-based policies map to Lake Formation grants to Identity Center users/groups. Knox topology-based data access maps to S3 Access Grants + Lake Formation.

Steps:

- Disable legacy IAM-only access control in Lake Formation Data Catalog settings (uncheck "Use only IAM access control").

- Integrate Lake Formation with IAM Identity Center — go to IAM Identity Center integration in Lake Formation and click Create.

- Enable external engine filtering — under Application integration settings, allow external engines to filter data in S3 locations registered with Lake Formation. Set AuthorizedSessionTagValue = Amazon EMR.

- Register S3 data locations with Lake Formation using a custom IAM role (not the service-linked role). This role must include: (1) a permission policy granting s3:PutObject, s3:GetObject, s3:DeleteObject on the registered S3 paths and s3:ListBucket on the bucket, and (2) a trust relationship that allows lakeformation.amazonaws.com to call both sts:AssumeRole and sts:SetContext — the sts:SetContext action is what enables trusted identity propagation and is not included in the default service-linked role. For the full policy templates, see [Setting up AWS Lake Formation with IAM Identity Center in the IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/tip-tutorial-lf.html) User Guide.

- Create Glue Data Catalog databases/tables that point to your migrated data in S3.

- Grant permissions to IAM Identity Center users and groups on those tables (row, column, cell-level supported).

For more information, see [Prerequisites for Trusted Identity Propagation with EMR on EC2](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-trusted-identity-prerequisites.html) in the Amazon EMR Management Guide.

## Phase 3: Set Up EMR Security Configuration

EMR Security Configuration with Identity Center replaces KnoxSSO gateway topology files. EMR in-transit encryption certificates replace Knox mutual TLS / SSL certs. EMR-managed Kerberos (auto-configured) replaces the manual KDC setup.

Steps:

- Create TLS certificates for EMR in-transit encryption (2048-bit RSA). For production environments, use AWS Private Certificate Authority (ACM Private CA) or your organization’s internal CA. Self-signed certificates should only be used for development and testing.

- Upload certificates to an Amazon S3 location accessible by the EMR service role.

- Create an EMR Security Configuration with IAM Identity Center integration enabled — this auto-configures Kerberos for supported applications. For step-by-step instructions, see [Configure Trusted Identity Propagation with EMR on EC2](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-trusted-identity-configure.html). AWS also provides a CloudFormation template (emr-tip.yaml) that automates much of this setup.

## Phase 4: Configure EMR Roles and Launch the Cluster

Steps:

- Create/configure IAM roles for EMR: EMR service role, EC2 instance profile role, and Lake Formation access role (with sts:AssumeRole trust).

- Launch an EMR cluster (release 6.15.0+ for EC2, or 7.8.0+ for Serverless) with the Identity Center-enabled security configuration and Lake Formation integration enabled. Verify the cluster reaches “Waiting” state without certificate or Kerberos errors — this confirms that the security configuration, certificates, and IAM roles from the previous steps are correctly set up.

- EMR automatically manages the credential relay — your Identity Center identity is propagated to Spark, Hive, Presto/Trino sessions.

## Phase 5: Set Up SageMaker Unified Studio (or EMR Studio)

SageMaker Unified Studio (SMUS) is the strategic, recommended IDE for new EMR migrations and the primary focus of AWS's new data and analytics IDE investment, replacing Knox-proxied HUE and Cloudera Manager UI. SMUS provides a unified environment for interactive Spark sessions, SQL analytics, and ML workloads with built-in Trusted Identity Propagation (TIP) support across EMR on EC2, EMR Serverless, Athena, and Redshift. EMR Studio remains available as an alternative for organizations that require capabilities not yet available in SMUS (see advisory below) or that have existing EMR Studio deployments.

Steps:

- Create a SageMaker Unified Studio project with EMR compute enabled (recommended for all new migrations). Alternatively, if your use case requires capabilities in the advisory below, create an EMR Studio workspace with IAM Identity Center integration (if SMUS is not suitable for your use case).

- Assign users/groups from Identity Center to the Studio.

- Users log in with corporate credentials and their identity is propagated to queries (Spark, Hive, Athena). For more details, see [Bring your workforce identity to Amazon EMR Studio and Athena](https://aws.amazon.com/blogs/big-data/bring-your-workforce-identity-to-amazon-emr-studio-and-athena/).

**Advisory — IDE Selection for Migration:** SageMaker Unified Studio (SMUS) is the strategic, recommended IDE for new deployments — AWS's active investment for new data, AI, and analytics IDE capabilities is in SMUS. EMR Studio remains available and supported, but is not the focus of new feature development. Upcoming IDE capabilities including enhanced collaboration, expanded compute integrations, and governance features, will land in SMUS first. EMR Studio may be appropriate when: (1) your organization requires AWS Service Catalog cluster templates for governed provisioning, (2) you need Git-native repository integration within the notebook environment, (3) you require parameterized headless notebook execution via the EMR API, or (4) you have an existing EMR Studio deployment and prefer a phased transition to SMUS. Note: Real-time multi-user notebook collaboration in EMR Studio Workspaces is NOT supported when Trusted Identity Propagation (TIP) is enabled. If your migration uses TIP (recommended), collaboration is not an EMR Studio advantage. Both SMUS and EMR Studio support Trusted Identity Propagation for per-user access control.

## Phase 6 (Optional): S3 Access Grants for Raw File Access

If you need prefix-level S3 authorization (similar to Ranger S3 policies), see [Simplify data lake access control with Trusted Identity Propagation](https://aws.amazon.com/blogs/big-data/simplify-data-lake-access-control-for-your-enterprise-users-with-trusted-identity-propagation-in-aws-iam-identity-center-aws-lake-formation-and-amazon-s3-access-grants/):

- Create an S3 Access Grants instance.

- Register an IAM Identity Center association.

- Define grants mapping Identity Center groups to S3 prefixes (read/write).

## Key Differences from Cloudera KnoxSSO

- No gateway proxy needed — identity flows natively through AWS services via OAuth token exchange.

- No topology files — access routing is handled by Lake Formation + Security Configuration.

- Kerberos is auto-managed — EMR configures it internally; no manual KDC setup.

- Audit is built-in — CloudTrail captures the propagated Identity Center user ID end-to-end.
