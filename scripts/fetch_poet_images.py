import urllib.request
import os
import json
import re
from urllib.request import Request, urlopen
import re
from bs4 import BeautifulSoup

payload = ""
headers = {}

base_url = 'https://poets.org'
directory = 'poets' 
html_string = ''
for filename in os.listdir(directory):
    f = os.path.join(directory, filename)
    if os.path.isfile(f):
        fo = open(f)
        data = json.load(fo)
        for poet_data in data['rows']:
            url = base_url + poet_data['view_node']
            req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            html = urlopen(req).read()
            print(url)
            bs = BeautifulSoup(html, 'html.parser')
            images = bs.find_all('meta', {'name':"og:image", 'content':re.compile('.*\.(?:jpg|gif|png|bmp)')})
            for image in images: 
                print(image['content']+'\n')
                image_url = image['content'].replace('social_share', 'poem_a_day_portrait')
                request_= urllib.request.Request(image_url, None, headers={'User-Agent': 'Mozilla/5.0'})
                response = urllib.request.urlopen(request_)
                f = open('images/' + poet_data['view_node'].split('/')[2] + '.jpg','wb')
                f.write(response.read())
                f.close()
