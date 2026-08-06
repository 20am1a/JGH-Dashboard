import os
import json
import zipfile

def build_standalone():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    index_html_path = os.path.join(base_dir, "index.html")
    style_css_path = os.path.join(base_dir, "style.css")
    app_js_path = os.path.join(base_dir, "app.js")
    json_path = os.path.join(base_dir, "dashboard_data.json")
    
    standalone_path = os.path.join(base_dir, "Standalone_Retailer_Dashboard.html")
    zip_path = os.path.join(base_dir, "JGH_Retailer_Scan_Intelligence_Client_Package.zip")
    excel_path = os.path.join(base_dir, "Retailer_Scan_Insights_July2026.xlsx")

    with open(index_html_path, "r", encoding="utf-8") as f:
        html = f.read()

    with open(style_css_path, "r", encoding="utf-8") as f:
        css = f.read()

    with open(app_js_path, "r", encoding="utf-8") as f:
        js = f.read()

    with open(json_path, "r", encoding="utf-8") as f:
        data_json = f.read()

    # Replace <link rel="stylesheet" href="style.css"> with <style>...</style>
    html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')

    # Update app.js so it reads embedded window.INLINE_DASHBOARD_DATA directly without fetch CORS restrictions
    custom_js = f"""
    window.INLINE_DASHBOARD_DATA = {data_json};
    {js}
    """

    # Replace <script src="app.js"></script> with <script>...</script>
    html = html.replace('<script src="app.js"></script>', f'<script>\n{custom_js}\n</script>')

    with open(standalone_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[OK] Standalone HTML created: {standalone_path}")

    # Create Client ZIP Package
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(standalone_path, arcname="Interactive_Dashboard.html")
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

2. **Retailer_Scan_Insights_July2026.xlsx**:
   - Comprehensive multi-sheet corporate Excel workbook.
   - Includes:
     * Executive Summary & Business Answers
     * Query1_Mapped_Scans (Mapped Box_count)
     * Query2_Retailer_Summary (Box_count = SUM(CASE WHEN uom='B5' THEN 0.5 ELSE 1 END))
     * State_Performance (Volume vs Intensity)
     * Daily_Scanning_Trends (Velocity run rate)
     * Category_Analysis (Packaging mix)
     * Raw_Data_Dump (100% full raw transaction dump)

3. **Raw_Data_Dump.csv**:
   - Complete raw transaction dataset for instant import into Power BI, Excel, or SQL.

---
Prepared for Executive Leadership & Client Reporting
"""
        zipf.writestr("README.txt", readme_content)
        
    print(f"[OK] Client ZIP Package generated: {zip_path}")

if __name__ == "__main__":
    build_standalone()
