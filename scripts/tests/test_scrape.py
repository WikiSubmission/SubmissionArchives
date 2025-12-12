import requests

url = "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-2-22-oct-1982"

try:
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    if "text-red-500" in response.text:
        print("FOUND: text-red-500 class is present in raw HTML.")
    else:
        print("NOT FOUND: text-red-500 class not found. Site is likely an SPA.")
        # Print a snippet to see what we got
        print(response.text[:500])
except Exception as e:
    print(e)
