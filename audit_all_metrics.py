import json

def audit_all():
    with open('dashboard_data.json', encoding='utf-8') as f:
        data = json.load(f)

    for k, v in data.items():
        if isinstance(v, list) and len(v) > 0:
            item0 = v[0]
            if isinstance(item0, dict):
                print(f"Key '{k}': List of {len(v)} dict items. Sample keys: {list(item0.keys())}")
            elif isinstance(item0, list):
                print(f"Key '{k}': List of {len(v)} list items. Sample item 0: {item0}")
            else:
                print(f"Key '{k}': List of {len(v)} primitive items. Sample: {item0}")
        elif isinstance(v, dict):
            print(f"Key '{k}': Dict with {len(v)} keys: {list(v.keys())[:10]}")

if __name__ == '__main__':
    audit_all()
