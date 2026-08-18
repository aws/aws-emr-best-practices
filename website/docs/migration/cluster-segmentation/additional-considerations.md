---
sidebar_label: Additional Considerations
---

# Additional Considerations for Segmentation

## Cost Implications

> Segmenting clusters adds primary node overhead (one primary node per cluster). Managed Scaling helps offset underutilization by dynamically right-sizing clusters.
>
> **Orchestration and Lifecycle Management**
>
> Managing multiple clusters requires automation:

- **Amazon MWAA (Managed Airflow) -** for DAG-based orchestration of cluster provisioning, job submission, and teardown

- **AWS Step Functions -** for event-driven cluster lifecycle management

- **EMR Managed Scaling -** reduces the need for custom idle-cluster termination logic

> **Instance Efficiency**
>
> Multiple smaller clusters reduce instance sharing efficiency. Mitigate with:

- Managed Scaling with scale-to-zero for task nodes

Instance Fleets with capacity-optimized Spot allocation
