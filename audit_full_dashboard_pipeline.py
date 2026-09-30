import json
import pandas as pd
import numpy as np

def full_audit():
    print("================================================================")
    print("   DEEP SYSTEMIC AUDIT OF JGH DASHBOARD DATA & CALCULATIONS    ")
    print("================================================================\n")

    # Load raw data dump
    raw_df = pd.read_csv('Raw_Data_Dump.csv')
    print(f"1. RAW DATA DUMP (Raw_Data_Dump.csv):")
    print(f"   - Total Scan Records: {len(raw_df):,}")
    print(f"   - Unique Retailers (status_retailer_id): {raw_df['status_retailer_id'].nunique():,}")
    print(f"   - UOM Value Distribution:\n{raw_df['uom'].value_counts(dropna=False)}")

    # Check State Name missing values
    print(f"\n   - State_Name Value Distribution (Top 10):")
    print(raw_df['State_Name'].value_counts(dropna=False).head(10))
    missing_states = raw_df['State_Name'].isna().sum() + (raw_df['State_Name'].astype(str).str.lower() == 'unknown state').sum()
    print(f"   - Missing/Unknown States: {missing_states:,} scans")

    # Check Category Name missing values
    missing_cats = raw_df['Category_Name'].isna().sum() + (raw_df['Category_Name'].astype(str).str.lower() == 'unknown category').sum()
    print(f"   - Missing/Unknown Categories: {missing_cats:,} scans")

    # Check Box Count Logic
    # Option A: Standard (B5 = 0.5, all others = 1.0)
    raw_df['Box_count_std'] = np.where(raw_df['uom'] == 'B5', 0.5, 1.0)
    total_boxes_std = raw_df['Box_count_std'].sum()
    print(f"\n2. BOX VOLUME CALCULATION COMPARISON:")
    print(f"   - Standard Rule (B5=0.5, all other UOMs=1.0): {total_boxes_std:,.1f} boxes")
    
    # Option B: Precise (B5=0.5, B10=1.0, B3=0.3, B1=0.1)
    raw_df['Box_count_precise'] = raw_df['uom'].map({'B5': 0.5, 'B10': 1.0, 'B3': 0.3, 'B1': 0.1}).fillna(1.0)
    total_boxes_precise = raw_df['Box_count_precise'].sum()
    print(f"   - Precise UOM Rule (B10=1.0, B5=0.5, B3=0.3, B1=0.1): {total_boxes_precise:,.1f} boxes")

    # Load JSON
    with open('dashboard_data.json', encoding='utf-8') as f:
        data = json.load(f)

    summary = data['summary']
    print(f"\n3. DASHBOARD_DATA.JSON SUMMARY RECORDED VALUES:")
    print(f"   - Recorded Total Scans: {summary['total_scans']:,}")
    print(f"   - Recorded Total Boxes: {summary['total_calculated_box_count']:,.1f}")
    print(f"   - Recorded B5 Scans: {summary['total_b5_scans']:,}")
    print(f"   - Recorded B10 Scans: {summary['total_b10_scans']:,}")

    # Check State Performance Sums in JSON
    states = data['state_performance']
    st_scans = sum(s['total_scans'] for s in states)
    st_boxes = sum(s['calculated_box_count'] for s in states)
    print(f"\n4. JSON STATE PERFORMANCE BREAKDOWN:")
    print(f"   - Sum of State Scans: {st_scans:,} (Diff from 226,700: {226700 - st_scans})")
    print(f"   - Sum of State Boxes: {st_boxes:,.1f} (Diff from Recorded Summary {summary['total_calculated_box_count']:,.1f}: {st_boxes - summary['total_calculated_box_count']})")

    # Check Category Performance Sums in JSON
    cats = data['category_performance']
    cat_scans = sum(c['total_scans'] for c in cats)
    cat_boxes = sum(c['calculated_box_count'] for c in cats)
    print(f"\n5. JSON CATEGORY PERFORMANCE BREAKDOWN:")
    print(f"   - Sum of Category Scans: {cat_scans:,}")
    print(f"   - Sum of Category Boxes: {cat_boxes:,.1f} (Diff from Recorded Summary {summary['total_calculated_box_count']:,.1f}: {cat_boxes - summary['total_calculated_box_count']})")

    # Check Single Category Scanners (Upsell Target Outlets)
    ret_cats = raw_df.groupby('status_retailer_id')['Category_Name'].nunique()
    single_cat_rets = (ret_cats == 1).sum()
    multi_cat_rets = (ret_cats > 1).sum()
    total_active_rets = len(ret_cats)
    print(f"\n6. CATEGORY CROSS-SELL / SINGLE-CATEGORY OUTLETS:")
    print(f"   - Single Category Outlets (1 Category Only): {single_cat_rets:,} ({single_cat_rets/total_active_rets*100:.1f}%)")
    print(f"   - Multi-Category Outlets (2+ Categories): {multi_cat_rets:,} ({multi_cat_rets/total_active_rets*100:.1f}%)")
    print(f"   - Total Active Outlets: {total_active_rets:,}")

if __name__ == '__main__':
    full_audit()
