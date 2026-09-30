import json
import pandas as pd
import numpy as np

def detailed_audit():
    raw_df = pd.read_csv('Raw_Data_Dump.csv')
    raw_df['Box_count'] = np.where(raw_df['uom'] == 'B5', 0.5, 1.0)
    
    print("================================================================")
    print("      EXACT DEFINITIVE AUDIT OF ALL DASHBOARD NUMBERS         ")
    print("================================================================\n")

    # 1. Total Scans & Box Volume
    tot_scans = len(raw_df)
    tot_boxes = raw_df['Box_count'].sum()
    b5_scans = (raw_df['uom'] == 'B5').sum()
    b10_scans = (raw_df['uom'] == 'B10').sum()
    b3_scans = (raw_df['uom'] == 'B3').sum()
    b1_scans = (raw_df['uom'] == 'B1').sum()
    tot_active_rets = raw_df['status_retailer_id'].nunique()

    print(f"1. OVERALL KPI CARD NUMBERS:")
    print(f"   - Total QR Scans: {tot_scans:,}")
    print(f"   - Total Box Volume (Box Equiv): {tot_boxes:,.1f}")
    print(f"   - Full Box Scans (B10/B3/B1 = 1.0 Box): {b10_scans + b3_scans + b1_scans:,}")
    print(f"     • B10: {b10_scans:,}")
    print(f"     • B3: {b3_scans:,}")
    print(f"     • B1: {b1_scans:,}")
    print(f"   - Half Box Scans (B5 = 0.5 Box): {b5_scans:,}")
    print(f"   - Active Retail Outlets (July 2026): {tot_active_rets:,}")
    print(f"   - Daily Scan Velocity (31 Days): {tot_scans / 31:,.2f} scans/day")
    print(f"   - Daily Box Velocity (31 Days): {tot_boxes / 31:,.2f} boxes/day")
    print(f"   - Avg Scans per Retailer: {tot_scans / tot_active_rets:.2f} scans/store")
    print(f"   - Avg Boxes per Retailer: {tot_boxes / tot_active_rets:.2f} boxes/store")

    # 2. Executive Action Cards (4 Cards)
    # Card 1: Single Category Scanners (Upsell Targets)
    ret_cats = raw_df.groupby('status_retailer_id')['Category_Name'].nunique()
    single_cat_rets = (ret_cats == 1).sum()
    multi_cat_rets = (ret_cats > 1).sum()
    
    # Card 2: Bronze Tier Upgrade (5-20 scans)
    ret_scans = raw_df.groupby('status_retailer_id')['id'].count()
    bronze_rets = ((ret_scans >= 5) & (ret_scans <= 20)).sum()
    low_rets = (ret_scans < 5).sum()
    silver_rets = ((ret_scans >= 21) & (ret_scans <= 50)).sum()
    gold_rets = (ret_scans > 50).sum()

    print(f"\n2. EXECUTIVE ACTION CARDS EXACT COUNTS:")
    print(f"   - Card 1: Single Category Buyers (Upsell Targets): {single_cat_rets:,} stores ({single_cat_rets/tot_active_rets*100:.1f}%)")
    print(f"   - Card 1: Multi Category Buyers (Loyal Basket): {multi_cat_rets:,} stores ({multi_cat_rets/tot_active_rets*100:.1f}%)")
    print(f"   - Card 2: Bronze Tier Outlets (5-20 Scans): {bronze_rets:,} stores ({bronze_rets/tot_active_rets*100:.1f}%)")
    print(f"   - Low Outlets (<5 Scans): {low_rets:,} stores ({low_rets/tot_active_rets*100:.1f}%)")
    print(f"   - Silver Outlets (21-50 Scans): {silver_rets:,} stores ({silver_rets/tot_active_rets*100:.1f}%)")
    print(f"   - Gold Outlets (>50 Scans): {gold_rets:,} stores ({gold_rets/tot_active_rets*100:.1f}%)")

    # Pareto Top 20%
    sorted_ret_scans = ret_scans.sort_values(ascending=False)
    top_20_pct_count = int(np.ceil(0.20 * tot_active_rets))
    top_20_scans_sum = sorted_ret_scans.head(top_20_pct_count).sum()
    print(f"\n3. PARETO 80/20 ANALYSIS:")
    print(f"   - Top 20% Outlets Count: {top_20_pct_count:,} out of {tot_active_rets:,}")
    print(f"   - Top 20% Outlets Scan Volume: {top_20_scans_sum:,} out of {tot_scans:,}")
    print(f"   - Pareto Share Percentage: {top_20_scans_sum / tot_scans * 100:.2f}%")

if __name__ == '__main__':
    detailed_audit()
