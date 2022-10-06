import requests
import json

main_url = 'https://api.poets.org/api/poets?page='
payload = ""
headers = {}


total_pages = 189
page_num = 0

while page_num <= total_pages:
    url = main_url + str(page_num)
    response = requests.request("GET", url, headers=headers, data=payload)
    with open('poets/data_' + str(page_num) + '.json', 'w') as f:
        json.dump(response.json(), f)
    page_num += 1
