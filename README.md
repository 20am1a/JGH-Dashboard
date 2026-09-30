# JGH Retailer Scan Intelligence & Executive Performance Dashboard

An enterprise-grade performance analytics dashboard engineered for executive decision-makers, territory managers, and supply chain analysts to monitor retailer QR scan velocity, calculated box volume throughput, distributor networks, and category mix across India.

---

## 📌 Executive Overview

The **JGH Retailer Scan Intelligence Dashboard** provides real-time visibility into retail network activity, converting raw QR code scan events into actionable business intelligence.

The dashboard supports two deployment modes:
1. **Hosted Client Architecture**: Modular [`index.html`](index.html), [`app.js`](app.js), and [`style.css`](style.css) served via any standard web server.
2. **100% Offline Standalone Distribution**: [`Standalone_Retailer_Dashboard.html`](Standalone_Retailer_Dashboard.html) — an entirely self-contained distribution bundling inlined styles, vendor libraries (Chart.js, Datalabels, SheetJS, ECharts), and pre-aggregated 6-month transaction data that runs on any machine with zero server or internet requirements.

---

## 🚀 Key Features & Capabilities

### 1. State Intelligence & Distributor Drilldown
- **Executive State Scorecards**: Real-time KPI scorecards for:
  - **Mapped Distributors**: Distinct active distributors operating in the state.
  - **Total Registered Stores**: Master registered retail footprint.
  - **Active Stores**: Retailers recording $\ge 1$ scans in the evaluation window.
  - **Inactive Gap**: Untapped or dormant retail accounts needing field re-activation.
  - **Scan & Box Volume**: Real scan transactions and calculated box conversions.
  - **Top Performing Category**: Highest volume SKU category in the state.
- **Retailer Segment Filtering**:
  - `🌐 All Stores`: Complete macro view of registered network.
  - `🟢 Active`: Outlets with recorded scan activity.
  - `🔴 Last 6M Inactive`: Registered outlets with 0 scans in the last 6 months.
  - `⚠️ Last 2M No Scan`: Dormant outlets that scanned historically but stopped scanning in the last 60 days.
- **Zero-Scan Category Charts Elimination**:
  - **Core Business Mandate**: *If stores recorded zero scans, category breakdown charts are illogical and must not be rendered.*
  - In both **Last 6M Inactive** and **Last 2M No Scan** modes, the entire category ranking row (containing **"Top 10 Scanned Categories in State"** and **"Low 10 Scanned Categories in State"**) is automatically hidden (`display: none`), and chart instances are destroyed to eliminate fake zero-scan bars.
  - Automatically restored to `display: 'grid'` when toggling back to `All Stores` or `Active`.
- **Dual Distributor Network Analytics**:
  - **Ranking Chart (Left)**: Ranks state distributors by scan volume (in Active mode) or by inactive/dormant retailer counts (in Inactive/Dormant modes).
  - **Active vs. Inactive Retailer Distribution (Right)**: Shows active and inactive store proportions per distributor with toggleable high-to-low / low-to-high sorting.
- **Flexible Date & Text Search Toolbar**:
  - Preset filters: *Jan–Till Date*, *August 2026*, *July 2026*, *June 2026*, *May 2026*, etc., alongside custom date pickers.
  - Real-time search across retailer name, mobile number, city/district, distributor, and status ID.

### 2. Partner Intelligence Card
- **Intelligent Active Default**: Automatically defaults to `🟢 Active` when opened, immediately presenting real scans, calculated boxes, and top-performing retailers.
- **Contextual Inactive Mode**: Selecting `🔴 Inactive` displays an executive warning banner explaining zero scan activity, with 1-click navigation to Active view and direct access to the store contact sheet.
- **Category & Performer Rankings**: Clean horizontal bar charts breaking down category throughput and ranking top scanning outlets.
- **Excel & CSV Export**: One-click download of distributor performance sheets powered by SheetJS.

### 3. Deep-Dive Modal Analytics
- **Category Visual Detail Modal**: Powered by comprehensive transaction data (`allScans`), enabling users to click any category bar to view all underlying products, style numbers, and contributing retailers across the state.
- **Single Retailer Modal**: Comprehensive store profile detailing total boxes, scan velocity, first/last scan dates, and full category distribution.

---

## 📐 Business Logic & Metric Formulas

### 1. Box Volume Conversion Formula
Box conversion accounts for packaging unit of measurement:
$$\text{Box Count} = \begin{cases} 0.5 & \text{if } \text{UOM} = \text{'B5'} \\ 1.0 & \text{otherwise} \end{cases}$$

### 2. Retailer Classification Rules
- **🟢 Active Outlets**: Recorded $\ge 1$ scans within the active evaluation window.
- **🔴 Inactive Outlets**: Registered in master database (`users` table, role=2) with **0 scans** across the last 6 months.
- **⚠️ Dormant Outlets (Churn Risk)**: Recorded scans historically but has **0 scans in the last 60 days (2 months)**.

### 3. Network Activation Rate
$$\text{Activation Rate (\%)} = \left(\frac{\text{Active Retailers}}{\text{Total Registered Retailers}}\right) \times 100$$

---

## 🛠️ Technology Stack

- **Core**: Vanilla HTML5, CSS3, Modern JavaScript (ES6+).
- **Visualization Engines**:
  - [Chart.js 4.x](vendor/chart.min.js) with [chartjs-plugin-datalabels](vendor/chartjs-plugin-datalabels.min.js).
  - [Apache ECharts 5.x](vendor/echarts.min.js) (Fallback & geographic map renders).
- **Data Export**: [SheetJS (xlsx.min.js)](vendor/xlsx.min.js) for client-side multi-sheet Excel report generation.
- **Icons & Typography**: FontAwesome 6 Pro, Google Fonts Inter.
- **Build & Packaging**: Python 3.x automated bundling script (`build_standalone_package.py`).

---

## 📁 Repository Structure

```
├── index.html                               # Main hosted dashboard HTML structure
├── app.js                                   # Core application logic, filters, and charts
├── style.css                                # Dashboard stylesheet & design tokens
├── build_standalone_package.py              # Pipeline to bundle offline Standalone HTML
├── process_data.py                          # Data processing & ETL pipeline script
├── distributor_counts.json                  # Distributor-retailer offline lookup map
├── .env.example                             # Database credentials template (zero secrets)
├── .gitignore                               # Git ignore configuration
├── PROJECT_DOCUMENTATION.md                 # Full detailed architectural documentation
├── RETAILER_SCAN_VISIBILITY_LOGIC.md        # Executive visibility & active/inactive rules
├── Strategic_Opportunity_Matrix_Formulas_and_Logic.md # Opportunity formulas reference
└── vendor/                                  # Bundled vendor scripts for offline use
    ├── chart.min.js
    ├── chartjs-plugin-datalabels.min.js
    ├── echarts.min.js
    └── xlsx.min.js
```

---

## 💻 Local Setup & Running

### Option 1: Running the Hosted Dashboard (Recommended for Development)
To run the dashboard locally with standard browser security:
```powershell
# Navigate to the project directory
cd "C:\Users\chandu\OneDrive\Desktop\JGH DASHBOARD"

# Start a local web server on port 8080
python -m http.server 8080
```
Open your browser and navigate to:
```
http://localhost:8080/index.html
```

### Option 2: Running the Standalone Offline Dashboard
If using the standalone bundle, simply double-click `Standalone_Retailer_Dashboard.html` or open it in any web browser (Chrome, Edge, Firefox, Safari). No server or network connection required.

### Building the Standalone Package
To re-compile the standalone distribution bundle after code changes:
```powershell
python build_standalone_package.py
```

---

## 🔒 Security & Credential Protection

- **Zero Hardcoded Secrets**: All database and API scripts strictly read connection credentials from local environment variables or secure CLI prompts.
- **Ignored Files**: `.env`, `.env.*`, temporary scratch debug scripts (`scratch/`), and local logs are strictly excluded from version control via `.gitignore`.
