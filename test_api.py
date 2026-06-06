import urllib.request
import json

url = "http://localhost:8000/listening/generate-from-text"
data = {
    "text": "A: Hey, are you ready for the English exam tomorrow? B: Not really. I'm still trying to memorize the vocabulary.",
    "mode": "conversation"
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={"Content-Type": "application/json"})

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS")
    print(response.read().decode('utf-8'))
except Exception as e:
    print("FAILED")
    print(e)
