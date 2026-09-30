# Strategic Business Opportunity Matrix — Measures & Formulas Guide
### Automated Business Intelligence (BI) Detection Engine

This document provides a clear, executive-friendly reference for each of the **5 Strategic Business Opportunity Cards** displayed on the JGH Dashboard. It outlines the **Business Purpose**, **Underlying Metric/Measure**, **Exact Mathematical Formula**, **Data Fields Used**, and a **Real Example** directly matching your dashboard.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STRATEGIC BUSINESS OPPORTUNITY MATRIX (AUTOMATED BI)                                   │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬────────────────────────────────────────┤
│  1. RETAILER      │  2. VOLUME        │  3. DISTRIBUTOR   │  4. CATEGORY      │  5. RETENTION &                        │
│     ENGAGEMENT    │     EXPANSION     │     ACTIVATION    │     GROWTH        │     RE-ACTIVATION                      │
│                   │                   │                   │                   │                                        │
│  Cross-Sell       │  Bronze Upgrade   │  Partner Leakage  │  State Penetration│  Churn Win-Back                        │
│  (Single Category)│  (5-20 Scans)     │  (<50% Active)    │  (Low Avg Velocity│  (60+ Days Silent)                     │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴────────────────────────────────────────┘
```

---

## Summary Matrix of Measures & Formulas

| Card | Opportunity Name | Measure / Metric Used | Mathematical / Logic Formula | Threshold / Condition |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Retailer Engagement** | Category Diversity per Retailer | $\text{Distinct Categories Scanned}(r)$ | $\text{Category Count} = 1$ |
| **2** | **Volume Expansion** | Scan Velocity & Tier Gap | $21 - \text{Current Scans}(r)$ | $5 \le \text{Current Scans} \le 20$ |
| **3** | **Distributor Activation** | Retailer Activation Coverage % | $\frac{\text{Active Outlets}(d)}{\text{Total Registered Outlets}(d)} \times 100$ | $\text{Activation Rate} < 50\%$ |
| **4** | **Category Growth** | State Store Penetration Ratio | $\frac{\text{Total Scans in State}(s)}{\text{Total Registered Stores in State}(s)}$ | $\min(\text{Ratio})$ among states with $\ge 50$ stores |
| **5** | **Retention & Win-Back** | Inactivity Gap (Days Silent) | $\text{Current Date} - \text{Last Scan Date}(r)$ | $60 \le \text{Days Silent} < 999$ |

---

## 1. Retailer Engagement Opportunity
### "High Retailer Count + Low Category Depth"

```
                     ┌───────────────────────────┐
                     │ Retailer Scans Across ALL │
                     │ Selected Invoices / Dates │
                     └─────────────┬─────────────┘
                                   │
                     ┌─────────────▼─────────────┐
                     │ Count Distinct Categories │
                     └─────────────┬─────────────┘
                                   │
                     ┌─────────────▼─────────────┐
                     │ Is Category Count == 1?   │
                     └─────────────┬─────────────┘
                                   │
                    YES ───────────┴─────────── NO
                     │                           │
          ┌──────────▼───────────┐     ┌─────────▼─────────┐
          │ Single-Category      │     │ Multi-Category    │
          │ Cross-Sell Candidate │     │ Basket Engaged    │
          │ (2,283 Retailers)    │     │ (Diversified)     │
          └──────────────────────┘     └───────────────────┘
```

### Business Objective
Retailers who actively scan only **one single sub-category** (for example, *Comfy Vest* only, or *Ladies* only) represent prime cross-sell opportunities. They already trust JGH and know how to scan QR codes; expanding their basket into adjacent categories is faster and cheaper than acquiring new retailers.

### Measure Used
* **Category Diversity Score**: The count of distinct `Category_Name` values scanned by a retailer within the selected date window.

### Mathematical Formula
$$\text{Distinct Categories}(r) = \text{COUNT}(\text{DISTINCT } \text{Category\_Name}) \quad \text{for retailer } r$$

$$\text{Single Category Retailers} = \sum_{r \in \text{Retailers}} \begin{cases} 1 & \text{if } \text{Distinct Categories}(r) = 1 \\ 0 & \text{otherwise} \end{cases}$$

### Data Fields Used
* `status_retailer_id` / `retailer_id`: Unique retailer identifier
* `Category_Name`: Scanned item category (e.g., *Comfy Vest*, *MCH/SPT Long*, *Comfy Ladies*)

### Dashboard Screenshot Example
* **`2,283 Retailers`**: Out of all active scanning stores, exactly 2,283 buy from only 1 single category.
* **Action**: Clicking **Target Retailers** opens the drill-down sheet to export this list for targeted SMS/WhatsApp category push campaigns.

---

## 2. Volume Expansion Opportunity
### "High Velocity + Bronze Tier Upgrade"

```
                       ┌─────────────────────────┐
                       │  Monthly Retailer Scans │
                       └────────────┬────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
  ┌────────▼────────┐      ┌────────▼────────┐      ┌────────▼────────┐
  │  Trial (<5)     │      │ Bronze (5–20)   │      │ Silver+ (21+)   │
  │ Low Consistency │      │ ★ TARGET POOL   │      │ Established     │
  └─────────────────┘      └────────┬────────┘      └─────────────────┘
                                    │
                     Formula: Scans Needed = 21 - Scans
                                    │
                     ┌──────────────▼─────────────┐
                     │ 4,376 Retailers in Bronze  │
                     │ Push to 21 Scans (Silver)  │
                     │ = +39,081 Additional Scans │
                     └────────────────────────────┘
```

### Business Objective
Retailers with **5 to 20 scans** have crossed the trial phase and scan regularly, but have not yet achieved **Silver Tier (21+ scans)**. Upgrading them requires only 1 to 16 additional scans, delivering guaranteed incremental box volume with minimal friction.

### Measures Used
1. **Current Scan Volume**: Total scans performed by the retailer in the selected period.
2. **Scans to Silver Gap**: Distance from current scans to the 25-scan Silver threshold.
3. **Total Additional Scans Potential**: Sum of scans required across all Bronze retailers to reach Silver.

### Mathematical Formulas

#### Retailer Tier Classification:
$$\text{Tier}(r) = \begin{cases} 
\text{Low / Trial} & \text{if } \text{Scans}(r) < 5 \\
\mathbf{Bronze} & \text{if } 5 \le \text{Scans}(r) \le 24 \\
\text{Silver} & \text{if } 25 \le \text{Scans}(r) \le 74 \\
\mathbf{Gold} & \text{if } \text{Scans}(r) \ge 75
\end{cases}$$

#### Scans Needed per Retailer:
$$\text{Scans to Silver}(r) = 25 - \text{Scans}(r) \quad \text{for } r \in \text{Bronze}$$

#### Total Volume Gain Potential:
$$\text{Total Additional Scans} = \sum_{r \in \text{Bronze}} \left( 25 - \text{Scans}(r) \right)$$

### Dashboard Example
* **`5,218 Retailers`** are currently in Bronze tier (5 to 24 scans).
* **`+58,751 Scans`**: If each of these 5,218 stores reaches 25 scans (Silver), the brand automatically gains 58,751 incremental scans (~52,000+ full box equivalents).

---

## 3. Distributor Activation Opportunity
### "High Distributor Base + Underperforming Scans"

```
              ┌─────────────────────────────────────────────────┐
              │          Distributor Network Audit              │
              └────────────────────────┬────────────────────────┘
                                       │
              ┌────────────────────────▼────────────────────────┐
              │  Calculate Retailer Activation Rate for each:   │
              │     Active Scanning Stores / Registered Stores  │
              └────────────────────────┬────────────────────────┘
                                       │
                     ┌─────────────────▼─────────────────┐
                     │   Is Activation Rate < 50%?       │
                     └─────────────────┬─────────────────┘
                                       │
                      YES ─────────────┴───────────── NO
                       │                              │
            ┌──────────▼──────────┐        ┌──────────▼──────────┐
            │ Underperforming     │        │ Healthy Distributor │
            │ Channel Partner     │        │ Coverage (>= 50%)   │
            │ (Enablement Target) │        └─────────────────────┘
            └─────────────────────┘
```

### Business Objective
Identifies distributor partner leakage. If a distributor has 80 registered retailers mapped in their territory but only 20 scan in a month (25% activation), the brand has poor reach through that partner. Field sales representatives must intervene.

### Measure Used
* **Distributor Retailer Activation Rate (%)**: Proportion of mapped retailer accounts actively scanning within the operating window (6-Month Active status for default full portfolio, or scans performed in selected date window).

### Mathematical Formula
$$\text{Activation Rate}(d) = \left( \frac{\text{Active Retailers}(d)}{\text{Total Registered Retailers Mapped}(d)} \right) \times 100\%$$

$$\text{Underperforming Distributors Count} = \sum_{d \in \text{Distributors}} \begin{cases} 1 & \text{if } \text{Activation Rate}(d) < 50\% \\ 0 & \text{otherwise} \end{cases}$$

Where:
- **Default Full View**: $\text{Active Retailers}(d) = \sum_{r \in \text{Network}(d)} \mathbb{I}(\text{is\_active\_6m} = 1)$
- **Date Filtered View**: $\text{Active Retailers}(d) = \sum_{r \in \text{Network}(d)} \mathbb{I}(\text{Scans in Period}(r) > 0)$

### Data Fields Used
* `distributor_name`: Mapped primary distributor
* `status_retailer_id`: Retailer ID
* `is_active_6m`: Active flag in standard 6-month operating window
* `dashboardData.all_retailers`: Master registry of all mapped retail stores

### Dashboard Example
* **`26 Distributors`**: On default pan-India view, exactly 26 distributors have $<50\%$ retailer activation over the 6-month operating window (e.g. *RAYBHAL ENTERPRISES* with 25 registered stores and 0 active, *BARNWAL HOSIERY HOUSE* with 5/12 active = 41.7%, *J K Hosiery* with 1/8 active = 12.5%, *Tamil Nadu*'s *SHRI SATHYANARAYANA TEXTILES* with 0/4 active).
* **When Filtered by Month**: When narrowed to a single month (e.g., August 2026), this dynamically calculates the 246 partners who had $<50\%$ of their base active in that specific month.
* **When Filtered by State**: Scopes directly to that state's channel network (e.g. 2 partners in Tamil Nadu).

---

## 4. Category Growth Opportunity
### "High Volume State + Low Category Mix"

```
                 ┌──────────────────────────────────────────────┐
                 │       State Market Footprint Analysis        │
                 └──────────────────────┬───────────────────────┘
                                        │
                 ┌──────────────────────▼───────────────────────┐
                 │ Filter for Significant States (>= 50 Stores) │
                 └──────────────────────┬───────────────────────┘
                                        │
                 ┌──────────────────────▼───────────────────────┐
                 │ Calculate Store Penetration Ratio:           │
                 │   Total State Scans / Registered State Stores│
                 └──────────────────────┬───────────────────────┘
                                        │
                 ┌──────────────────────▼───────────────────────┐
                 │  Find State with Lowest Average Scans/Store  │
                 │         ==> IDENTIFIED: Tamil Nadu           │
                 └──────────────────────────────────────────────┘
```

### Business Objective
Pinpoints territories with large retail infrastructure but below-potential throughput. Instead of opening more stores, the brand achieves high ROI by expanding secondary product lines into existing stores.

### Measure Used
* **State Store Penetration Ratio**: Average scans generated per registered store in that state.

### Mathematical Formula
$$\text{Store Penetration Ratio}(s) = \frac{\text{Total Scans in State}(s)}{\text{Total Registered Retailers in State}(s)}$$

$$\text{Opportunity State} = \arg\min_{s \in \text{States}, \, \text{Registered}(s) \ge 50} \left( \text{Store Penetration Ratio}(s) \right)$$

### Data Fields Used
* `State_Name` / `state`: Geolocation
* `dashboardData.all_retailers`: Master store count per state
* `filteredScans`: Total scan volume per state in the period

### Dashboard Screenshot Example
* **`Tamil Nadu`**: Has a large network of registered stores ($\ge 50$ stores), but has the lowest scan-per-store velocity across major markets, driven predominantly by a single product line.
* **Action**: Launch distributor incentives to introduce secondary categories (e.g. Athlix or Briefs).

---

## 5. Retention & Re-activation
### "Dormant Outlets (No Scans Last 2 Months)"

```
                    ┌──────────────────────────────────┐
                    │    Retailer Inactivity Engine    │
                    └─────────────────┬────────────────┘
                                      │
                    ┌─────────────────▼────────────────┐
                    │ Calculate Days Silent:           │
                    │   Evaluation Date - LastScanDate │
                    └─────────────────┬────────────────┘
                                      │
                    ┌─────────────────▼────────────────┐
                    │    Is Days Silent >= 60 Days?    │
                    └─────────────────┬────────────────┘
                                      │
                     YES ─────────────┴───────────── NO
                      │                              │
           ┌──────────▼──────────┐        ┌──────────▼──────────┐
           │   Dormant Outlet    │        │  Active / Retained  │
           │  (High Churn Risk)  │        │  Scanning Store     │
           │  Win-Back Campaign  │        └─────────────────────┘
           └─────────────────────┘
```

### Business Objective
Prevents permanent retailer churn. Retailers who stop scanning for **60 consecutive days (2 billing cycles)** are typically substituting with a competing brand. Immediate win-back field visits or bonus coupons are triggered before the store is lost permanently.

### Measure Used
* **Days Silent**: Number of calendar days elapsed since the retailer's most recent scan.
* **Volume at Risk**: Historical monthly box volume contributed by these silent retailers.

### Mathematical Formula
$$\text{Days Silent}(r) = \text{Date}_{\text{Evaluation}} - \text{Date}_{\text{Last Scan}}(r)$$

$$\text{Dormant Condition}: 60 \le \text{Days Silent}(r) < 999$$

$$\text{Silent Outlets Count} = \sum_{r \in \text{Retailers}} \begin{cases} 1 & \text{if } 60 \le \text{Days Silent}(r) < 999 \\ 0 & \text{otherwise} \end{cases}$$

$$\text{Total Boxes at Risk} = \sum_{r \in \text{Dormant}} \text{Average Monthly Boxes}(r)$$

### Data Fields Used
* `scan_date` / `retailer_scanned_at`: Historical scan timestamps
* `last_scan`: Most recent recorded QR scan date
* `uom`: Box sizing (B10 = 1.0 Box, B5 = 0.5 Box)

---

## Quick Reference Summary Table for Executives

| Opportunity Card | Key Question It Answers | Primary Trigger / Threshold | High-Level ROI Impact |
| :--- | :--- | :--- | :--- |
| **Retailer Engagement** | *Which stores are ready for product cross-sell?* | Store scans exactly **1 category** | Higher basket size without acquiring new stores |
| **Volume Expansion** | *How to quickly push Bronze stores into high-volume Silver?* | Store scans between **5 and 20 times** | Unlocks **+39,081 scans** immediately |
| **Distributor Activation** | *Which distributors are under-utilizing their retail network?* | Mapped store activation is **< 50%** | Plugs distribution channel leakage |
| **Category Growth** | *Which state has big potential but low category throughput?* | Major market with **lowest scans / store** | Expands market share in major states |
| **Retention & Win-back** | *Which valuable accounts are slipping away to competitors?* | No scans for **60+ days (2 months)** | Protects existing revenue and prevents churn |
