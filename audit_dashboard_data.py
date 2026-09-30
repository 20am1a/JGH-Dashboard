import json
import pandas as pd

def audit():
    with open('dashboard_data.json', encoding='utf-8') as f:
        data = json.load(f)

    print("==================================================")
    print("      JGH DASHBOARD COMPREHENSIVE DATA AUDIT      ")
    print("==================================================\n")

    summary = data.get('summary', {})
    print("1. SUMMARY METRICS AUDIT:")
    print(f"  - Total Scans: {summary.get('total_scans'):,}")
    print(f"  - Total Calculated Box Count: {summary.get('total_calculated_box_count'):,}")
    print(f"  - B10 Full Boxes (1.0): {summary.get('total_b10_scans'):,}")
    print(f"  - B5 Half Boxes (0.5): {summary.get('total_b5_scans'):,}")
    print(f"  - Active Retailers (July 2026): {summary.get('total_retailers'):,}")
    print(f"  - Total Days: {summary.get('total_days')}")
    print(f"  - Avg Scans / Day: {summary.get('avg_scans_per_day'):,}")
    print(f"  - Avg Boxes / Day: {summary.get('avg_boxes_per_day'):,}")
    print(f"  - Avg Scans / Retailer: {summary.get('avg_scans_per_retailer')}")
    print(f"  - Avg Boxes / Retailer: {summary.get('avg_boxes_per_retailer')}")
    print(f"  - Total Distributors: {summary.get('total_distributors')}")

    # Verify B10 + B5 Box Math
    b10 = summary.get('total_b10_scans', 0)
    b5 = summary.get('total_b5_scans', 0)
    calc_boxes = (b10 * 1.0) + (b5 * 0.5)
    print(f"\n  [CHECK] Box Calculation Formula:")
    print(f"    ({b10:,} B10 * 1.0) + ({b5:,} B5 * 0.5) = {calc_boxes:,.1f}")
    print(f"    Recorded Summary Boxes = {summary.get('total_calculated_box_count'):,.1f}")
    print(f"    Formula Match: {calc_boxes == summary.get('total_calculated_box_count')}")

    # 2. State Performance Audit
    states = data.get('state_performance', [])
    print(f"\n2. STATE PERFORMANCE AUDIT ({len(states)} States/UTs):")
    tot_st_scans = sum(s.get('scans', 0) for s in states)
    tot_st_retailers = sum(s.get('retailers', 0) for s in states)
    tot_st_boxes = sum(s.get('box_count', 0) for s in states)

    print(f"  - Sum of State Scans: {tot_st_scans:,} (Target: {summary.get('total_scans'):,}) -> Match: {tot_st_scans == summary.get('total_scans')}")
    print(f"  - Sum of State Retailers: {tot_st_retailers:,} (Target: {summary.get('total_retailers'):,}) -> Match: {tot_st_retailers == summary.get('total_retailers')}")
    print(f"  - Sum of State Boxes: {tot_st_boxes:,.1f} (Target: {summary.get('total_calculated_box_count'):,.1f}) -> Match: {abs(tot_st_boxes - summary.get('total_calculated_box_count')) < 1}")

    print("\n  Top 5 States by Volume:")
    sorted_st_vol = sorted(states, key=lambda x: x.get('scans', 0), reverse=True)
    for s in sorted_st_vol[:5]:
        print(f"    • {s['state']}: {s['scans']:,} scans | {s.get('box_count', 0):,.1f} boxes | {s['retailers']:,} retailers | Avg: {s.get('avg_scans_per_retailer', 0):.1f} scans/store")

    # 3. Category Performance Audit
    cats = data.get('category_performance', [])
    print(f"\n3. CATEGORY PERFORMANCE AUDIT ({len(cats)} Categories):")
    tot_cat_scans = sum(c.get('scans', 0) for c in cats)
    tot_cat_boxes = sum(c.get('box_count', 0) for c in cats)
    print(f"  - Sum of Category Scans: {tot_cat_scans:,} (Target: {summary.get('total_scans'):,}) -> Match: {tot_cat_scans == summary.get('total_scans')}")
    print(f"  - Sum of Category Boxes: {tot_cat_boxes:,.1f} (Target: {summary.get('total_calculated_box_count'):,.1f}) -> Match: {abs(tot_cat_boxes - summary.get('total_calculated_box_count')) < 1}")

    print("\n  Category List & Metrics:")
    for c in sorted(cats, key=lambda x: x.get('scans', 0), reverse=True):
        print(f"    • {c['category']}: {c['scans']:,} scans ({c.get('share_pct', 0):.2f}%) | {c.get('box_count', 0):,.1f} boxes | {c.get('retailers', 0):,} retailers")

    # 4. Daily Scanning Audit
    daily = data.get('daily', [])
    print(f"\n4. DAILY SCANNING VELOCITY AUDIT ({len(daily)} Days):")
    tot_daily_scans = sum(d.get('scans', 0) for d in daily)
    tot_daily_boxes = sum(d.get('box_count', 0) for d in daily)
    print(f"  - Sum of Daily Scans: {tot_daily_scans:,} (Target: {summary.get('total_scans'):,}) -> Match: {tot_daily_scans == summary.get('total_scans')}")
    print(f"  - Sum of Daily Boxes: {tot_daily_boxes:,.1f} (Target: {summary.get('total_calculated_box_count'):,.1f}) -> Match: {abs(tot_daily_boxes - summary.get('total_calculated_box_count')) < 1}")

    # 5. Retailer Tiers Audit
    tiers = data.get('retailer_tiers', [])
    print(f"\n5. RETAILER TIER SEGMENTATION AUDIT ({len(tiers)} Tiers):")
    tot_tier_rets = sum(t.get('retailers', 0) for t in tiers)
    tot_tier_scans = sum(t.get('scans', 0) for t in tiers)
    print(f"  - Sum of Tier Retailers: {tot_tier_rets:,} (Target: {summary.get('total_retailers'):,}) -> Match: {tot_tier_rets == summary.get('total_retailers')}")
    print(f"  - Sum of Tier Scans: {tot_tier_scans:,} (Target: {summary.get('total_scans'):,}) -> Match: {tot_tier_scans == summary.get('total_scans')}")
    for t in tiers:
        print(f"    • Tier {t.get('tier')}: {t.get('retailers'):,} retailers ({t.get('share_pct'):.1f}%) | {t.get('scans'):,} scans")

    # 6. Retailers List Audit
    retailers = data.get('retailers', [])
    print(f"\n6. RETAILERS LIST AUDIT ({len(retailers):,} Active Retailers):")
    scans_from_rets = sum(r.get('scans', 0) for r in retailers)
    print(f"  - Sum of Scans across Retailers List: {scans_from_rets:,} (Target: {summary.get('total_scans'):,}) -> Match: {scans_from_rets == summary.get('total_scans')}")

    # 7. All Retailers Audit (Active + Dormant)
    all_retailers = data.get('all_retailers', [])
    print(f"\n7. ALL RETAILERS DATASET AUDIT ({len(all_retailers):,} Total Registered Retailers):")
    act_rets = [r for r in all_retailers if r.get('is_active_july') or r.get('july_scans', 0) > 0 or r.get('scans', 0) > 0]
    dorm_rets = [r for r in all_retailers if not (r.get('is_active_july') or r.get('july_scans', 0) > 0 or r.get('scans', 0) > 0)]
    print(f"  - Total Registered Retailers: {len(all_retailers):,}")
    print(f"  - Active Retailers in July 2026: {len(act_rets):,}")
    print(f"  - Inactive / Dormant Retailers: {len(dorm_rets):,}")
    print(f"  - Calculation: Total Registered ({len(all_retailers):,}) - Active ({len(act_rets):,}) = Inactive ({len(dorm_rets):,})")

if __name__ == '__main__':
    audit()
