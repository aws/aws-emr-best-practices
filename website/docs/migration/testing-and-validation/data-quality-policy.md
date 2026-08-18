---
sidebar_label: Data Quality Policy
---

# Overall Data Quality Policy

Frequently, data sources and extraction processes used during initial development differ from production. For example, research is often performed on sample, cleaned, or enriched data from a data lake, while production uses raw, real-time data. This assumption should be tested.

**Create data lineage diagrams:**

1.  Development pipeline - Document all data sources and transformations used to build models

2.  Production pipeline - Document the production data catalog and pipeline

3.  Gap analysis - Identify similarities and differences

**Key questions to address:**

- If pipelines are the same, are they subject to the same errors? Are these errors acceptable?

- If pipelines differ, do differences impact analytics jobs or ML models? How do you know?

Share diagrams with subject matter experts and project sponsors. If the gap is too large, consider alternative approaches to sourcing data that better represent production circumstances.

## Estimating Impact of Data Quality
