import os
import json
import zipfile
import re

def build_standalone():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "dashboard_data.json")
    js_data_path = os.path.join(base_dir, "dashboard_data.js")
    
    # Read dashboard_data.js directly if it exists, otherwise generate from json
    if os.path.exists(js_data_path) and os.path.getsize(js_data_path) > 1000:
        print("[OK] Reading existing dashboard_data.js directly...")
        with open(js_data_path, "r", encoding="utf-8") as f:
            content = f.read()
        prefix = "window.INLINE_DASHBOARD_DATA = "
        if content.startswith(prefix):
            data_json = content[len(prefix):].rstrip("; \r\n")
        else:
            data_json = content
        print(f"[OK] Loaded data_json from dashboard_data.js ({len(data_json)} chars)")
    elif os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        minified_json = json.dumps(raw_data, separators=(',', ':'))
        with open(js_data_path, "w", encoding="utf-8") as f:
            f.write(f"window.INLINE_DASHBOARD_DATA = {minified_json};")
        print(f"[OK] Auto-generated dashboard_data.js from JSON (minified)")
        data_json = minified_json
    else:
        data_json = "{}"

    index_html_path = os.path.join(base_dir, "index.html")
    style_css_path = os.path.join(base_dir, "style.css")
    app_js_path = os.path.join(base_dir, "app.js")
    
    standalone_path = os.path.join(base_dir, "Standalone_Retailer_Dashboard.html")
    zip_path = os.path.join(base_dir, "JGH_Retailer_Scan_Intelligence_Client_Package.zip")
    excel_path = os.path.join(base_dir, "Retailer_Scan_Insights_July2026.xlsx")

    with open(index_html_path, "r", encoding="utf-8") as f:
        html = f.read()

    with open(style_css_path, "r", encoding="utf-8") as f:
        css = f.read()

    with open(app_js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Read vendor libraries to inline into standalone HTML for 100% offline self-containment
    vendor_js = ""
    vendor_files = [
        os.path.join(base_dir, "vendor", "chart.min.js"),
        os.path.join(base_dir, "vendor", "chartjs-plugin-datalabels.min.js"),
        os.path.join(base_dir, "vendor", "xlsx.min.js"),
        os.path.join(base_dir, "vendor", "echarts.min.js")
    ]
    for vf in vendor_files:
        if os.path.exists(vf):
            with open(vf, "r", encoding="utf-8") as f:
                vendor_js += f.read() + "\n;\n"

    # Replace vendor script tags with inlined JS code
    html = re.sub(
        r'<!-- Chart\.js, Datalabels, SheetJS & ECharts.*?<script>if \(typeof echarts === \'undefined\'\).*?<\/script>',
        lambda m: f'<script>\n{vendor_js}\n</script>',
        html,
        flags=re.DOTALL
    )

    # Replace CSS link with inline style using regex and lambda to avoid backslash issues
    html = re.sub(
        r'<link\s+rel="stylesheet"\s+href="style\.css(?:\?v=\d+)?"\s*>',
        lambda m: f'<style>\n{css}\n</style>',
        html
    )

    # Update app.js so it reads embedded window.INLINE_DASHBOARD_DATA directly without fetch CORS restrictions
    custom_js = f"""
    window.INLINE_DASHBOARD_DATA = {data_json};
    {js}
    """

    # Remove standalone dashboard_data.js script tag if present
    html = re.sub(r'<script\s+src="dashboard_data\.js(?:\?[^"]*)?"\s*></script>\s*', '', html)

    # Replace JS script tag with inline script using regex and lambda to avoid backslash issues
    html = re.sub(
        r'<script\s+src="app\.js(?:\?[^"]*)?"\s*></script>',
        lambda m: f'<script>\n{custom_js}\n</script>',
        html
    )

    with open(standalone_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[OK] Standalone HTML created: {standalone_path}")

    # Create Client ZIP Package
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(standalone_path, arcname="Interactive_Dashboard.html")
        zipf.write(index_html_path, arcname="index.html")
        zipf.write(app_js_path, arcname="app.js")
        zipf.write(style_css_path, arcname="style.css")
        zipf.write(json_path, arcname="dashboard_data.json")
        data_js_path = os.path.join(base_dir, "dashboard_data.js")
        if os.path.exists(data_js_path):
            zipf.write(data_js_path, arcname="dashboard_data.js")
        for vf in vendor_files:
            if os.path.exists(vf):
                rel_name = os.path.relpath(vf, base_dir)
                zipf.write(vf, arcname=rel_name)
        
        candidate_excels = [
            excel_path.replace(".xlsx", "_Final.xlsx"),
            excel_path.replace(".xlsx", "_Updated.xlsx"),
            excel_path.replace(".xlsx", "_v2.xlsx"),
            excel_path
        ]
        for ep in candidate_excels:
            if os.path.exists(ep):
                try:
                    zipf.write(ep, arcname="Retailer_Scan_Insights_July2026.xlsx")
                    break
                except Exception as ex:
                    print(f"[NOTE] Could not package {ep}: {ex}")
                
        csv_path = os.path.join(base_dir, "Raw_Data_Dump.csv")
        if os.path.exists(csv_path):
            zipf.write(csv_path, arcname="Raw_Data_Dump.csv")
            
        readme_content = """# JGH Retailer Scan Intelligence - Client Delivery Package

## Contents:
1. **Interactive_Dashboard.html**:
   - Double-click to open in any web browser (Chrome, Edge, Safari, Firefox).
   - No installation or internet server required.
   - Includes interactive filters, charts, KPI scorecards, retailer rankings, and CSV export.

2. **Source Code Files (for hosting on web server):**
   - **index.html**: The master dashboard HTML structure.
   - **style.css**: Premium custom stylesheet.
   - **app.js**: Dynamic filtering, Chart.js renders, and data processing.
   - **dashboard_data.json**: The full underlying scan data (loadable by index.html when hosted).

3. **Retailer_Scan_Insights_July2026.xlsx**:
   - Comprehensive multi-sheet corporate Excel workbook.
   - Includes:
     * Executive Summary & Business Answers
     * Query1_Mapped_Scans (Mapped Box_count)
     * Query2_Retailer_Summary (Box_count = SUM(CASE WHEN uom='B5' THEN 0.5 ELSE 1 END))
     * State_Performance (Volume vs Intensity)
     * Daily_Scanning_Trends (Velocity run rate)
     * Category_Analysis (Packaging mix)
     * Raw_Data_Dump (100% full raw transaction dump)

4. **Raw_Data_Dump.csv**:
   - Complete raw transaction dataset for instant import into Power BI, Excel, or SQL.

---
Prepared for Executive Leadership & Client Reporting
"""
        zipf.writestr("README.txt", readme_content)
        
    print(f"[OK] Client ZIP Package generated: {zip_path}")

if __name__ == "__main__":
    build_standalone()
