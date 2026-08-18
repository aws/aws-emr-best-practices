---
sidebar_label: Estimating Impact
---

# Estimating Impact of Data Quality

During initial analytics jobs, it's common to begin with cleaned data or clean data before running jobs. For example:

- Data might be dropped if no direct key match is found during merges

- Records with null or extreme values might be dropped

- Multiple cleaning and transformation steps are performed

However, production data comes from different sources through different paths. To ensure production behavior matches development:

**Compare Statistics**

Add formal checkpoints comparing source input data to data actually used for training. Evaluate from both quantitative and qualitative perspectives.

**Quantitative Evaluation:**

- Compare counts - Identify, track, and highlight data loss. What percentage of source data was used? Is there potential bias from unintentionally dropped data?

- Review data duration - What time period does each dataset cover? Are all relevant business cycles included?

- Quantify precision - Compare mean, median, and standard deviation. Calculate outliers. Use box plots for visual assessment of key variables.

**Qualitative Evaluation**

- Assess accuracy - Based on experience and sample exploration, how confident are you that data is accurate?

- Document anecdotes - Are there sufficient error reports? (e.g., "this sensor always runs high")

- Segment data - Take different actions on segments discovered during analysis

**Validate Model Against Unclean Data Inputs**

Take a subset of data eliminated during every cleaning/transformation step and compare it to data eventually used. Assess resulting outputs:

- Does the endpoint provide reasonable responses in all cases?

- Where should checks and error handling be added?

- Should error handling be added to the inference endpoint, or should calling applications handle problematic inputs/outputs?

## Tools to Help with Data Quality
