import requests
import json

main_url = 'https://api.poets.org/api/poems?page='
payload = ""
headers = {}


total_pages = 663
page_num = 0

while page_num <= total_pages:
    url = main_url + str(page_num)
    response = requests.request("GET", url, headers=headers, data=payload)
    with open('poems/data_' + str(page_num) + '.json', 'w') as f:
        json.dump(response.json(), f)
    page_num += 1
