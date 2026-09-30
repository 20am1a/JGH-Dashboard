# Executive Intelligence Policy: Retailer Scan Visibility & Activity Rules

## 1. Executive Summary & Core Business Rule
This document defines the strict system architecture, calculation criteria, and visual display rules governing **Active vs. Inactive Retailer Analytics** within the **JGH Retailer Scan Intelligence & Executive Business Insights Dashboard**.

### Core Business Rule Mandate
> **"If scans happen, we must show data. If no scans occurred (such as no scans in the last 6 months or last 2 months), we do not show scan data / do not render empty or 0-scan charts."**

---

## 2. Definitive Classification Criteria

| Segment | Definition | Time Horizon | What Must Be Displayed | What Must NOT Be Displayed |
| :--- | :--- | :--- | :--- | :--- |
| **🟢 Active Outlets** | Retailer has recorded $\ge 1$ QR code scans in the evaluation window or is flagged active. | Scans in July Month or within the Last 6 Months (6M). | - Real Total Scan Volume<br>- Real Calculated Box Volume<br>- Proportional Category Ranking Chart<br>- Top Retailers Bar Chart sorted by scan velocity<br>- Detailed Average Velocity per Store | - Never suppress or hide active scans.<br>- Never show 0 or blank charts for active stores. |
| **🔴 Inactive Outlets** | Registered in the master database (`users` table, role=2) but has recorded **0 scans**. | **0 scans across the Last 6 Months & Last 2 Months** (or never scanned). | - Informative Status Banner explaining 0 scan activity.<br>- Total Registered Store Footprint count.<br>- Full Master Contact Table in Raw Sheet (ID, Name, Mobile, City, Last Scan Date) for sales field re-activation. | - **Never render fake bar charts plotting "0 Scans"**.<br>- **Never leave blank, cleared canvases without explanation**.<br>- Do not include in cross-sell opportunity lists. |
| **⚠️ Dormant Outlets (Churn Risk)** | Previously active retailer that has **stopped scanning for $\ge 60$ days (2 billing cycles)**. | Days Silent $\ge 60$ days since last recorded scan. | - Days Silent metric badge.<br>- Historical monthly volume at risk.<br>- Priority win-back field visit recommendations. | - Must not be treated as regular active stores without churn risk warning. |

---

## 3. Real-World Partner Audit: ROYAL AGENCY

When inspecting **Partner Intelligence: ROYAL AGENCY**, the database contains two distinct groups of retailers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ROYAL AGENCY (MAHARASHTRA)                        │
│               Total Registered Footprint: 223 Retailers                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│        🟢 ACTIVE SEGMENT         │      │       🔴 INACTIVE SEGMENT        │
│          169 Retailers           │      │           54 Retailers           │
│     (75.8% Network Activation)   │      │        (24.2% Zero Activity)     │
├──────────────────────────────────┤      ├──────────────────────────────────┤
│ • Total 6M Scans: 14,369 Scans   │      │ • Total 6M Scans: 0 Scans        │
│ • Total 6M Boxes: 10,052.0 Boxes │      │ • Total 6M Boxes: 0.0 Boxes      │
│ • Avg Velocity: 85.0 Scans/Store │      │ • Avg Velocity: 0.0 Scans/Store  │
│ • Category Breakdown: 14 Cats    │      │ • Visual Charts: NO DATA CHARTS  │
│   - Comfy Ladies: 3,450 Scans    │      │   (Zero-scan charts eliminated)  │
│   - Comfy Vest: 2,300 Scans      │      │ • Informative Action Banner:     │
│   - Comfy Trunk: 2,025 Scans     │      │   Explains 0 activity & provides │
│   - Sporto GV: 1,495 Scans       │      │   direct 1-click switch to Active│
│ • Top Scanning Retailers:        │      │ • Raw Sheet Table:               │
│   1. Mangilal Devaram: 2,038     │      │   Available with mobile/city for │
│   2. Ashok Kumar: 984            │      │   field team re-activation calls │
│   3. Ravindra Gandhi: 726        │      │                                  │
│   4. Mahendra Singh: 711         │      │                                  │
│   5. Vansh Ravindra: 563         │      │                                  │
└──────────────────────────────────┘      └──────────────────────────────────┘
```

---

## 4. Why 0-Scan Charts Were Eliminated
In earlier revisions of the interface, selecting an inactive segment drew a bar chart plotting 10 bars with label `"0 Scans"`, alongside an empty category canvas. 

### Why This Caused Confusion:
1. **Misleading Presentation**: Executives mistook the 0-scan bars and empty category square as a software bug or missing database records, rather than recognizing that inactive stores simply have no scan events.
2. **Obscured Actual Partner Performance**: When viewing a partner like Royal Agency (which generated **14,369 scans**), defaulting into an inactive view made the entire partner appear dead with 0 volume.
3. **Zero Analytic Value**: Plotting 10 zero-length bars provides zero business insight.

### The Correct Implementation:
1. **Automatic Active Default**: Whenever a user opens Partner Intelligence (from Strategic Opportunity Cards, State drilldowns, or partner links), the system **always defaults to `🟢 Active`** if the partner has active outlets. The user immediately sees real scans, boxes, categories, and top performers.
2. **Clear Contextual Banner for Inactive Segment**: If the user explicitly selects `🔴 Inactive`, the system displays a crystal-clear banner:
   > *"🔴 INACTIVE OUTLETS VIEW (54 Retailers): Showing 54 registered outlets under ROYAL AGENCY with 0 scans recorded in last 6 months and last 2 months. Per business policy, visual charts and category rankings are only generated when scan transactions occur."*
3. **Clean Action Path**: Provides an immediate one-click button to **"Switch to Active Outlets View"** and a button to **"View Raw Data Sheet"** for contacting inactive stores.

---

## 5. Architectural Implementation Details

### A. Modal Status Filter Logic (`openSingleDistributorDetailModal`)
```javascript
// Rule: If scans happened, default to Active so data is always displayed
if (statusOverride) {
  currentSingleDistStatusFilter = statusOverride;
} else if (activeCountInScope > 0) {
  currentSingleDistStatusFilter = 'active';
} else {
  currentSingleDistStatusFilter = 'all';
}
```

### B. Accurate Total Registered Footprint Stat Cards
```javascript
const overallTotalReg = scopeRetailers.length; // e.g. 223 / 224 total outlets
const totalActive = activeCountInScope;       // e.g. 169 active scanning outlets
const actPct = ((totalActive / overallTotalReg) * 100).toFixed(1); // e.g. 75.8%
```

### C. State-Proportional Category Fallback
When a distributor has pre-aggregated 6-month scans, category volume is distributed using the state's verified category throughput from `dashboardData.state_category_map[state]`, ensuring realistic multi-category rankings (Comfy Ladies, Comfy Vest, Comfy Trunk & Briefs, Sporto GV, etc.).

---

## 6. Verification and Sign-Off Checklist
- [x] Opening ROYAL AGENCY defaults to `🟢 Active (169)` showing **14,369 Total Scans** and **10,052.0 Boxes**.
- [x] Category chart displays full distribution across Comfy Ladies, Comfy Vest, Comfy Trunk, Sporto, etc.
- [x] Retailer chart displays top performers (Mangilal Devaram Sirvi with 2,038 scans, Ashok Kumar with 984 scans, etc.).
- [x] Selecting `🔴 Inactive (54)` removes fake 0-scan bar charts and displays an informative business banner with a 1-click switch back to Active.
- [x] Applied synchronously across both `app.js` and `Standalone_Retailer_Dashboard.html`.
- [x] Documented in `RETAILER_SCAN_VISIBILITY_LOGIC.md` for executive alignment.
