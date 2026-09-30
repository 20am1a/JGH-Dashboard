# JGH Retailer Scan Intelligence & Executive Performance Dashboard
## Comprehensive Project Documentation & Release Notes

---

## 1. Executive Overview

The **JGH Retailer Scan Intelligence Dashboard** is an enterprise-grade performance analytics platform designed to analyze, track, and visualize retailer scanning activity, box volume conversion, distributor fulfillment networks, and product category throughput across India.

The platform provides dual deployment capabilities:
1. **Hosted Client/Server Architecture**: Modular [`index.html`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/index.html) + [`app.js`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/app.js) + [`style.css`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/style.css) served over HTTP.
2. **Standalone 100% Offline Bundle**: [`Standalone_Retailer_Dashboard.html`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/Standalone_Retailer_Dashboard.html) — an entirely self-contained distribution containing inlined styles, bundled Chart.js/ECharts/SheetJS libraries, and pre-aggregated 6-month transaction data that runs on any machine with zero server or internet requirements.

---

## 2. Core Business Rules & Classification Logic

### A. Active vs. Inactive vs. Dormant Rules
Per executive business mandate:
> **"If scans happen, we must show data. If no scans occurred (such as no scans in the last 6 months or last 2 months), we do not show scan data / do not render empty or 0-scan charts."**

| Segment | Definition | Time Horizon | Visual Display Behavior |
| :--- | :--- | :--- | :--- |
| **🟢 Active Outlets** | Retailer recorded $\ge 1$ QR code scans in evaluation window. | July 2026 or Last 6 Months (6M). | Displays full scan velocity, calculated box volume, category rankings, and top performer charts. |
| **🔴 Inactive Outlets** | Registered in master database (`users`, role=2) with **0 scans**. | Last 6 Months (6M Inactive). | **Eliminates zero-scan charts and blank category canvases completely.** Displays clear informative status banner with 1-click switch to Active view and master contact audit sheet for field team re-engagement. |
| **⚠️ Dormant Outlets** | Registered retailers with **0 scans in the last 60 days (2 months)**. | Last 2 Months (No Scans 2M). | Flags account churn risk. **Hides category scan charts completely** (since no scans occurred in the last 2 months). Shows days silent indicators and win-back recommendations. |

### B. Box Volume Conversion Formula
Box conversion accounts for packaging unit of measurement:
$$\text{Box Count} = \begin{cases} 0.5 & \text{if } \text{UOM} = \text{'B5'} \\ 1.0 & \text{otherwise} \end{cases}$$

---

## 3. Major Architectural Features & Implementation Details

### 1. State Intelligence & Distributor Drilldown (`stateDistributorOpportunityPageView`)
- **State Executive Scorecards**: Live KPI tiles for Mapped Distributors, Registered Retailer Footprint, Active Stores, Inactive Store Gap, Total Scans / Calculated Box Volume, and Top Performing Category.
- **Dynamic Segment Controls**:
  - `🌐 All Stores`
  - `🟢 Active`
  - `🔴 Last 6M Inactive`
  - `⚠️ Last 2M No Scan`
- **Zero-Scan Category Charts Elimination**:
  - In `🔴 Last 6M Inactive` and `⚠️ Last 2M No Scan` modes, the entire category breakdown row (containing **"Top 10 Scanned Categories in State"** and **"Low 10 Scanned Categories in State"**) is set to `display: 'none'` and Chart.js instances are destroyed.
  - Automatically restored to `display: 'grid'` when switching back to `All Stores` or `Active`.
- **Distributor Ranking & Network Distribution Charts**:
  - Left Chart: Dynamically ranks distributors by Total Scan Volume (Active mode) or Inactive/Dormant Store Count (Inactive/Dormant modes).
  - Right Chart: Active vs Inactive retailer distribution under each distributor with high-to-low / low-to-high sorting toggle.
- **Interactive Filtering & Table Search**: Real-time store search across retailer name, mobile, city, distributor, and ID, paired with monthly date presets and custom date range pickers.

### 2. Partner Intelligence Modal (`openSingleDistributorDetailModal`)
- **Intelligent Active Default**: Automatically defaults to `🟢 Active` when opened so executives immediately see actual scans, boxes, category breakdowns, and top scanning retailers.
- **Contextual Inactive Banner**: Explicit selection of Inactive displays a clean executive banner explaining zero scan activity and providing one-click switching to Active view.
- **Dual Visual Charts**:
  - Horizontal bar chart of top scanned categories.
  - Horizontal bar chart of top retailers sorted by volume.
- **One-Click Excel / CSV Export**: Instant SheetJS export of distributor-specific store performance.

### 3. Category & Product Intelligence Modal (`openCategoryVisualDetailModal`)
- Fixed data source to use comprehensive `allScans` (instead of locally filtered scope) so that clicking any category bar displays all products, styles, and retailers across the state with accurate metrics.
- Seamless drilldown into product SKU breakdowns and retailer ranking lists.

### 4. Single Retailer Visual Card (`openSingleRetailerVisualModal`)
- Fixed to pull from global transaction data, rendering complete retailer history, total box volume, scan frequency, and category distribution.

### 5. Automated Standalone Packaging Pipeline (`build_standalone_package.py`)
- Python build script that inlines CSS, embeds vendor JavaScript (Chart.js, Datalabels, SheetJS, ECharts), and inlines the pre-aggregated JSON dataset into `Standalone_Retailer_Dashboard.html`.
- Optimized to directly read pre-minified `dashboard_data.js` for fast execution without memory overload.
- Generates a delivery-ready client ZIP package: `JGH_Retailer_Scan_Intelligence_Client_Package.zip`.

---

## 4. Security & Credential Protection

Strict security practices have been implemented across all project files:
1. **Zero Hardcoded Credentials**:
   - All database connection scripts ([`process_data.py`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/process_data.py), [`run_query.py`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/run_query.py), [`count_query.py`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/count_query.py), [`check_raw_data.py`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/check_raw_data.py), [`extract_and_pivot.py`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/extract_and_pivot.py)) read credentials securely from environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) or prompt securely via `getpass.getpass()`.
2. **Template Configuration**:
   - [`.env.example`](file:///c:/Users/chandu/OneDrive/Desktop/JGH%20DASHBOARD/.env.example) contains only dummy placeholder values (`your_db_host`, `your_db_password`, etc.).
3. **Enhanced `.gitignore` Protection**:
   - `.env` and `.env.*` are strictly ignored.
   - Scratch testing directories (`scratch/`), temporary logs (`*.log`), and local temporary backups (`app_backup.js`) are excluded from Git tracking.

---

## 5. Verification & Testing Summary

Comprehensive end-to-end automated tests using Playwright verified:
- **Hosted Dashboard (`http://localhost:8080/index.html`)**:
  - `🔴 Last 6M Inactive`: Category charts row display `none` (Hidden) — **PASS**
  - `⚠️ Last 2M No Scan`: Category charts row display `none` (Hidden) — **PASS**
  - `🌐 All Stores`: Category charts row display `grid` (Visible) — **PASS**
  - `🟢 Active Stores`: Category charts row display `grid` (Visible) — **PASS**
- **Standalone Bundle (`Standalone_Retailer_Dashboard.html`)**:
  - `🔴 Last 6M Inactive`: Category charts row display `none` (Hidden) — **PASS**
  - `⚠️ Last 2M No Scan`: Category charts row display `none` (Hidden) — **PASS**
  - `🌐 All Stores`: Category charts row display `grid` (Visible) — **PASS**
  - `🟢 Active Stores`: Category charts row display `grid` (Visible) — **PASS**
