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
        
        # Check raw data in sku_inventories
        query = "SELECT * FROM sku_inventories LIMIT 5;"
        df = pd.read_sql(query, connection)
        print("Raw data from sku_inventories:")
        print(df.to_string())
        
        # Check if there are rows that aren't just string names
        query2 = "SELECT * FROM sku_inventories WHERE id != 'id' LIMIT 5;"
        df2 = pd.read_sql(query2, connection)
        print("\nRows where id != 'id':")
        print(df2.to_string())
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    main()
