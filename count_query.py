import os
import base64
import getpass
import pymysql
from dotenv import load_dotenv

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

count_query = """
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
        COALESCE(
            skui.status_retailer_id,
            skui.status_wholeseller_id
        ) AS customer_id
    FROM sku_inventories skui
    JOIN sku_products p 
        ON p.id = skui.product_id
    WHERE LOWER(p.season) = 'winter'
      AND (
            (skui.retailer_scanned_at >= '2025-10-01' AND skui.retailer_scanned_at < '2025-11-01')
            OR 
            (skui.wholesaler_scanned_at >= '2025-10-01' AND skui.wholesaler_scanned_at < '2025-11-01')
          )
)

SELECT COUNT(*) as total_rows
FROM scan_data sd
LEFT JOIN user_info ui 
    ON ui.id = sd.customer_id
LEFT JOIN box_scans bs 
    ON bs.skui_id = sd.id
LEFT JOIN mypoints mp 
    ON mp.sku_inventory_id = sd.id
   AND mp.users_id = sd.customer_id;
"""

def main():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute(count_query)
            result = cursor.fetchone()
            print(f"Total Rows Count: {result['total_rows']}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    main()
