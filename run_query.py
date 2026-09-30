import os
import base64
import getpass
import pandas as pd
import pymysql
import warnings
from dotenv import load_dotenv

warnings.filterwarnings('ignore', category=UserWarning)

load_dotenv()

def _get_password():
    pwd = os.getenv("DB_PASSWORD", "")
    pwd_enc = os.getenv("DB_PASSWORD_ENC", "")
    if pwd:
        return pwd
    elif pwd_enc:
        try:
            return base64.b64decode(pwd_enc.encode()).decode()
        except Exception:
            pass
    return getpass.getpass("Enter DB Password: ")

DB_HOST = os.getenv("DB_HOST", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = _get_password()
DB_NAME = os.getenv("DB_NAME", "")
DB_PORT = int(os.getenv("DB_PORT", "3306"))

query = """
WITH user_info AS (
    SELECT 
        u.id,
        COALESCE(m.shop_name, u.name) AS customer_name,
        u.pincode, 
        u.city,
        pam.city AS actual_city,
        s.sname AS state,
        z.name AS zone,
        u.user_role
    FROM users u
    LEFT JOIN mechanic_details m 
        ON m.mechanic_id = u.id
    LEFT JOIN state s 
        ON s.id = u.state_id
    LEFT JOIN zones z 
        ON z.id = s.zone_id
    LEFT JOIN pincode_address_maps pam 
        ON pam.pincode = u.pincode
    WHERE u.user_role IN (2,5)
),

box_scans AS (
    SELECT 
        reference_id AS skui_id, 
        schemes.scheme_name,
        swt.amount AS earned_units, 
        'Scheme Scan' AS scan_type
    FROM scheme_wallet_transactions swt
    JOIN schemes 
        ON schemes.id = swt.scheme_id
    WHERE swt.reference_type = 'sku_scan'
      AND swt.created_at >= '2025-10-01'
      AND swt.created_at < '2025-11-01'

    UNION ALL

    SELECT 
        reference_id, 
        NULL, 
        gwt.amount, 
        'Gift Scan'
    FROM gift_scan_wallet_transactions gwt
    WHERE gwt.reference_type = 'sku_scan'
      AND gwt.created_at >= '2025-10-01'
      AND gwt.created_at < '2025-11-01'

    UNION ALL

    SELECT 
        reference_id, 
        NULL, 
        wst.amount, 
        'Winter Scan'
    FROM winter_scan_wallet_transactions wst
    WHERE wst.reference_type = 'sku_scan'
      AND wst.created_at >= '2025-10-01'
      AND wst.created_at < '2025-11-01'
),

scan_data AS (
    SELECT 
        skui.id,
        skui.lpn_number,

        COALESCE(skui.uom, sqpm.uom) AS resolved_uom,
        sqpm.box_calculation_uom,
        sqpm.pcs_calculation_uom,

        DATE(skui.created_at) AS created_at,

        skui.sku_code, 
        skui.sku_description,

        p.product_name, 
        p.product_code,
        p.season AS product_type,

        mc.name AS category_name,
        cg.name AS category_sub_group,
        b.brand_name AS style,

        d.name AS distributor,
        d.sap_code,
        dis_st.sname AS distributor_state,

        DATE(skui.wholesaler_scanned_at) AS wholesaler_scanned_on,
        DATE(skui.retailer_scanned_at) AS retailer_scanned_on,

        -- Week Number
        (
            WEEK(
                COALESCE(
                    skui.retailer_scanned_at,
                    skui.wholesaler_scanned_at
                ), 
                0
            )
            - WEEK(
                DATE_SUB(
                    COALESCE(
                        skui.retailer_scanned_at,
                        skui.wholesaler_scanned_at
                    ),
                    INTERVAL DAYOFMONTH(
                        COALESCE(
                            skui.retailer_scanned_at,
                            skui.wholesaler_scanned_at
                        )
                    ) - 1 DAY
                ), 
                0
            ) + 1
        ) AS week_number,

        CASE
            WHEN skui.status_retailer_id IS NOT NULL 
                 AND skui.status_wholeseller_id IS NULL 
                THEN 'Retailer'

            WHEN skui.status_wholeseller_id IS NOT NULL 
                 AND skui.status_retailer_id IS NULL 
                THEN 'Wholesaler'

            ELSE 'Both'
        END AS scan_by,

        COALESCE(
            skui.status_retailer_id,
            skui.status_wholeseller_id
        ) AS customer_id,

        CASE 
            WHEN skui.status_retailer_id IS NOT NULL 
                THEN 'Retailer' 
            ELSE 'Wholesaler' 
        END AS customer_type

    FROM sku_inventories skui

    JOIN sku_products p 
        ON p.id = skui.product_id

    LEFT JOIN master_categories mc 
        ON mc.id = p.categories

    LEFT JOIN category_sub_groups cg 
        ON cg.id = p.category_sub_group_id

    LEFT JOIN brands b 
        ON b.id = p.brand

    JOIN companies d 
        ON d.id = skui.distributer_id

    -- Distributor user
    LEFT JOIN users du 
        ON du.distributer_id = d.id 
       AND du.user_role = 4

    LEFT JOIN state dis_st 
        ON dis_st.id = du.state_id

    LEFT JOIN (
        SELECT 
            sku_code, 
            uom,
            MIN(box_calculation_uom) AS box_calculation_uom,
            MIN(pcs_calculation_uom) AS pcs_calculation_uom
        FROM sku_qr_points_maps
        GROUP BY sku_code, uom
    ) sqpm
        ON sqpm.sku_code = REPLACE(skui.sku_code, ' ', '')
       AND sqpm.uom = skui.uom

    -- October 2025 + Winter products
    WHERE LOWER(p.season) = 'winter'
      AND skui.sku_code != 'sku_code'
      AND COALESCE(
            skui.retailer_scanned_at,
            skui.wholesaler_scanned_at
          ) >= '2025-10-01'
      AND COALESCE(
            skui.retailer_scanned_at,
            skui.wholesaler_scanned_at
          ) < '2025-11-01'
)

SELECT 
    sd.*,

    -- Final week label
    CASE 
        WHEN sd.week_number = 1 THEN 'Week 1'
        WHEN sd.week_number = 2 THEN 'Week 2'
        WHEN sd.week_number = 3 THEN 'Week 3'
        WHEN sd.week_number = 4 THEN 'Week 4'
        ELSE 'Week 5'
    END AS scan_week,

    ui.customer_name, 
    ui.city, 
    ui.pincode, 
    ui.state, 
    ui.zone, 
    ui.actual_city,

    COALESCE(
        bs.scan_type, 
        'Cash Point Scan'
    ) AS scan_type,

    bs.scheme_name,
    bs.earned_units,

    mp.points AS earned_point

FROM scan_data sd

LEFT JOIN user_info ui 
    ON ui.id = sd.customer_id

LEFT JOIN box_scans bs 
    ON bs.skui_id = sd.id

LEFT JOIN mypoints mp 
    ON mp.sku_inventory_id = sd.id
   AND mp.users_id = sd.customer_id

LIMIT 10;
"""

def main():
    try:
        print("Connecting to the database...")
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print("Executing exact query with LIMIT 10...")
        df = pd.read_sql(query, connection)
        
        if df.empty:
            print("Query executed successfully, but returned 0 rows.")
        else:
            excel_path = "scan_data_testing_10_rows.xlsx"
            df.to_excel(excel_path, index=False)
            print(f"Results successfully saved to '{excel_path}'")
            
    except pymysql.MySQLError as e:
        print(f"Database error occurred: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()
