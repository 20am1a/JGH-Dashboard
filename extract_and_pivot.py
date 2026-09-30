import pandas as pd
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
import sys

SQL_QUERY_COMBINED = """
SELECT
    u.name AS retailer_name,
    u.mobile_number,
    u.pincode,
    u.city,
    s.sname AS State_Name,
    mc.name AS Category_Name,
    si.*,
    COALESCE(b.Box_count, 0) AS Box_count
FROM sku_inventories si
JOIN users u
    ON si.status_retailer_id = u.id
JOIN state s
    ON s.id = u.state_id
JOIN sku_products sp
    ON sp.id = si.product_id
JOIN master_categories mc
    ON mc.id = sp.categories
LEFT JOIN (
    SELECT
        status_retailer_id,
        SUM(CASE WHEN uom = 'B5' THEN 0.5 ELSE 1 END) AS Box_count
    FROM sku_inventories
    WHERE retailer_scanned_at >= '2026-07-01'
      AND retailer_scanned_at < '2026-08-01'
    GROUP BY status_retailer_id
) b ON b.status_retailer_id = si.status_retailer_id
WHERE si.retailer_scanned_at >= '2026-07-01'
  AND si.retailer_scanned_at < '2026-08-01'
  AND u.user_role = 2;
"""

db_configs = [
    {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "DAuser"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "WMSLiveDB"),
        "port": int(os.getenv("DB_PORT", "3306"))
    }
]

df_q1 = None
connected_db = None

for cfg in db_configs:
    try:
        enc_pwd = quote_plus(cfg["password"])
        engine = create_engine(f"mysql+pymysql://{cfg['user']}:{enc_pwd}@{cfg['host']}:3306/{cfg['database']}", pool_pre_ping=True, connect_args={'connect_timeout': 5})
        with engine.connect() as conn:
            res = conn.execute(text("SHOW TABLES LIKE 'sku_inventories'")).fetchall()
            if res:
                print(f"Connected to DB {cfg['database']} at {cfg['host']}! Executing query...")
                df_q1 = pd.read_sql(text(SQL_QUERY_COMBINED), conn)
                connected_db = cfg['database']
                break
    except Exception as e:
        print(f"Failed to connect to {cfg['host']}: {e}")
        pass

if df_q1 is not None:
    print(f"Successfully extracted {len(df_q1)} rows.")
    
    # Create Pivot Tables
    pivot_state_cat = pd.pivot_table(
        df_q1, 
        values='Box_count', 
        index='State_Name', 
        columns='Category_Name', 
        aggfunc='sum', 
        fill_value=0
    )
    
    pivot_retailer = pd.pivot_table(
        df_q1,
        values=['Box_count', 'id'],
        index=['retailer_name', 'State_Name'],
        aggfunc={'Box_count': 'sum', 'id': 'count'},
        fill_value=0
    ).rename(columns={'id': 'Total_Scans'})
    
    # Save to Excel
    output_file = "Extracted_Data_With_Pivot.xlsx"
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df_q1.to_excel(writer, sheet_name='Raw_Data', index=False)
        pivot_state_cat.to_excel(writer, sheet_name='Pivot_State_vs_Category')
        pivot_retailer.to_excel(writer, sheet_name='Pivot_Retailer_Summary')
        
    print(f"SUCCESS: Data and Pivot Tables saved to {output_file}")
else:
    print("ERROR: Could not connect to any live database. Generating pivot table using offline dummy data.")
    
    # Generate dummy data for pivot
    import numpy as np
    import pandas as pd
    
    # We will just load the Raw_Data_Dump_Final.csv if it exists to provide the pivot
    import os
    if os.path.exists('Raw_Data_Dump_Final.csv'):
        df = pd.read_csv('Raw_Data_Dump_Final.csv')
        pivot_state_cat = pd.pivot_table(df, values='Box_count', index='State_Name', columns='Category_Name', aggfunc='sum', fill_value=0)
        pivot_retailer = pd.pivot_table(df, values=['Box_count', 'id'], index=['retailer_name', 'State_Name'], aggfunc={'Box_count': 'sum', 'id': 'count'}, fill_value=0).rename(columns={'id': 'Total_Scans'})
        
        output_file = "Extracted_Data_With_Pivot.xlsx"
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Raw_Data', index=False)
            pivot_state_cat.to_excel(writer, sheet_name='Pivot_State_vs_Category')
            pivot_retailer.to_excel(writer, sheet_name='Pivot_Retailer_Summary')
        print(f"SUCCESS: Offline Data and Pivot Tables saved to {output_file}")
    else:
        print("ERROR: Could not find offline data either.")
