import urllib.request
try:
    html = urllib.request.urlopen('https://admin.jghmagic.com/').read().decode('utf-8')
    print('Length of live HTML:', len(html))
    print('Contains View Insights:', 'View Insights' in html)
    print('Contains onclick=openUpsellModal:', 'onclick="openUpsellModal()"' in html)
except Exception as e:
    print('Error:', e)
