import json

def verify_math():
    with open('dashboard_data.json', encoding='utf-8') as f:
        data = json.load(f)

    summary = data['summary']

    print("==================================================")
    print("      MATHEMATICAL VERIFICATION REPORT           ")
    print("==================================================\n")

    # 1. Total Scans Verification
    tot_scans = summary['total_scans']
    tot_boxes = summary['total_calculated_box_count']
    b10_scans = summary['total_b10_scans']
    b5_scans = summary['total_b5_scans']
    b5_b10_sum = b10_scans + b5_scans
    print(f"1. TOTAL SCANS MATH:")
    print(f"   - B10 Scans ({b10_scans:,}) + B5 Scans ({b5_scans:,}) = {b5_b10_sum:,}")
    print(f"   - Recorded Summary Total Scans = {tot_scans:,}")
    print(f"   - Scan Sum Match: {b5_b10_sum == tot_scans}")

    calc_boxes = (b10_scans * 1.0) + (b5_scans * 0.5)
    print(f"\n2. BOX VOLUME MATH:")
    print(f"   - Formula: ({b10_scans:,} * 1.0) + ({b5_scans:,} * 0.5) = {calc_boxes:,.1f}")
    print(f"   - Recorded Summary Total Boxes = {tot_boxes:,.1f}")
    print(f"   - Box Volume Match: {calc_boxes == tot_boxes}")

    # 3. State Performance Audit
    states = data['state_performance']
    st_scans_sum = sum(s['total_scans'] for s in states)
    st_boxes_sum = sum(s['calculated_box_count'] for s in states)
    print(f"\n3. STATE PERFORMANCE SUMS ({len(states)} States):")
    print(f"   - Sum of State Scans: {st_scans_sum:,} (Target: {tot_scans:,}) -> Match: {st_scans_sum == tot_scans}")
    print(f"   - Sum of State Boxes: {st_boxes_sum:,.1f} (Target: {tot_boxes:,.1f}) -> Match: {abs(st_boxes_sum - tot_boxes) < 1}")

    # 4. Category Performance Audit
    cats = data['category_performance']
    cat_scans_sum = sum(c['total_scans'] for c in cats)
    cat_boxes_sum = sum(c['calculated_box_count'] for c in cats)
    print(f"\n4. CATEGORY PERFORMANCE SUMS ({len(cats)} Categories):")
    print(f"   - Sum of Category Scans: {cat_scans_sum:,} (Target: {tot_scans:,}) -> Match: {cat_scans_sum == tot_scans}")
    print(f"   - Sum of Category Boxes: {cat_boxes_sum:,.1f} (Target: {tot_boxes:,.1f}) -> Match: {abs(cat_boxes_sum - tot_boxes) < 1}")

    # 5. Daily Scanning Audit
    daily = data['daily']
    daily_scans_sum = sum(d['total_scans'] for d in daily)
    daily_boxes_sum = sum(d['calculated_box_count'] for d in daily)
    print(f"\n5. DAILY VELOCITY SUMS ({len(daily)} Days):")
    print(f"   - Sum of Daily Scans: {daily_scans_sum:,} (Target: {tot_scans:,}) -> Match: {daily_scans_sum == tot_scans}")
    print(f"   - Sum of Daily Boxes: {daily_boxes_sum:,.1f} (Target: {tot_boxes:,.1f}) -> Match: {abs(daily_boxes_sum - tot_boxes) < 1}")

    # 6. Retailer Tiers Audit
    tiers = data['retailer_tiers']
    tier_rets_sum = sum(tiers.values()) if isinstance(tiers, dict) else sum(t['retailers'] for t in tiers)
    print(f"\n6. RETAILER TIERS SUMS:")
    print(f"   - Sum of Tier Retailers: {tier_rets_sum:,} (Target: {summary['total_retailers']:,}) -> Match: {tier_rets_sum == summary['total_retailers']}")

    # 7. Distributor Analysis Audit
    dists = data['distributor_analysis']
    dist_scans_sum = sum(d['total_scans'] for d in dists)
    dist_boxes_sum = sum(d['total_boxes'] for d in dists)
    print(f"\n7. DISTRIBUTOR ANALYSIS SUMS ({len(dists)} Distributors):")
    print(f"   - Sum of Distributor Scans: {dist_scans_sum:,} (Target: {tot_scans:,}) -> Match: {dist_scans_sum == tot_scans}")
    print(f"   - Sum of Distributor Boxes: {dist_boxes_sum:,.1f} (Target: {tot_boxes:,.1f}) -> Match: {abs(dist_boxes_sum - tot_boxes) < 1}")

if __name__ == '__main__':
    verify_math()
