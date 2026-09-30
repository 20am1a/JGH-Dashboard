import json
import pandas as pd

def audit_tiers_and_dists():
    raw_df = pd.read_csv('Raw_Data_Dump.csv')
    
    # 1. Retailer Tiers
    ret_scans = raw_df.groupby('status_retailer_id')['id'].count().reset_index()
    ret_scans.columns = ['retailer_id', 'total_scans']
    
    ret_scans['tier'] = pd.cut(
        ret_scans['total_scans'],
        bins=[-1, 4, 20, 50, 999999],
        labels=["Low (<5)", "Bronze (5-20)", "Silver (21-50)", "Gold (>50)"]
    )
    
    print("=== RETAILER TIER BREAKDOWN (July 2026 Scans) ===")
    tier_grouped = ret_scans.groupby('tier', observed=False).agg(
        retailer_count=('retailer_id', 'count'),
        total_scans=('total_scans', 'sum')
    ).reset_index()
    
    tier_grouped['retailer_share_pct'] = (tier_grouped['retailer_count'] / len(ret_scans) * 100).round(2)
    tier_grouped['scan_share_pct'] = (tier_grouped['total_scans'] / len(raw_df) * 100).round(2)
    print(tier_grouped.to_string(index=False))
    print(f"Total Active Retailers: {tier_grouped['retailer_count'].sum():,}")
    print(f"Total Scans across Tiers: {tier_grouped['total_scans'].sum():,}")

    # 2. Distributor Breakdown
    dist_scans = raw_df.groupby('distributor_name')['id'].count().reset_index()
    dist_scans.columns = ['distributor_name', 'july_scans']
    print(f"\n=== DISTRIBUTOR BREAKDOWN ===")
    print(f"Distributors with active scans in July 2026: {len(dist_scans)}")
    print(f"Total scans from distributors: {dist_scans['july_scans'].sum():,}")

if __name__ == '__main__':
    audit_tiers_and_dists()
