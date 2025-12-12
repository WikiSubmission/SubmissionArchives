import requests
import time
import os
import json

API_KEY = "sk_6eaf1e2300854d83b20d5c223cecd0d0"
FILE_PATH = "The Creator's Signature.mp4" # Using a smaller file for test
OBJECT_KEY = "media://test"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}"
}

def upload_file():
    print("1. Requesting upload URL...")
    res = requests.post(
        "https://api.pyannote.ai/v1/media/input",
        headers=HEADERS,
        json={"url": OBJECT_KEY}
    )
    print(f"Response Status: {res.status_code}")
    # print(f"Response Body: {res.text}")
    if res.status_code != 200 and res.status_code != 201:
        print(f"Failed to get upload URL: {res.text}")
        return None
    
    data = res.json()
    upload_url = data["url"]
    print(f"   Got URL. Uploading {FILE_PATH}...")
    
    with open(FILE_PATH, "rb") as f:
        # Content-Type application/octet-stream is generic and safe
        put_res = requests.put(upload_url, data=f, headers={"Content-Type": "application/octet-stream"})
        
    if put_res.status_code != 200:
        print(f"Upload failed: {put_res.text}")
        return None
        
    print("   Upload successful.")
    return OBJECT_KEY

def start_diarization(object_key):
    print("2. Starting diarization job...")
    res = requests.post(
        "https://api.pyannote.ai/v1/diarize",
        headers=HEADERS,
        json={"url": object_key} # API expects 'url' to be the object key for hosted files
    )
    if res.status_code != 200: # 201 is created usually, but let's check
        if res.status_code != 201:
            print(f"Failed to start job: {res.text}")
            return None
            
    job_data = res.json()
    job_id = job_data["jobId"]
    print(f"   Job started. ID: {job_id}")
    return job_id

def poll_job(job_id):
    print("3. Polling for results...")
    while True:
        res = requests.get(
            f"https://api.pyannote.ai/v1/jobs/{job_id}",
            headers=HEADERS
        )
        if res.status_code != 200:
            print(f"Polling failed: {res.text}")
            break
            
        job_status = res.json()
        status = job_status["status"]
        print(f"   Status: {status}")
        
        if status == "succeeded":
            print("   Job succeeded!")
            return job_status["output"] # Should contain the result
        elif status == "failed":
            print("   Job failed.")
            return None
            
        time.sleep(5)

def main():
    if not os.path.exists(FILE_PATH):
        print(f"File not found: {FILE_PATH}")
        return

    key = upload_file()
    if not key: return
    
    job_id = start_diarization(key)
    if not job_id: return
    
    result = poll_job(job_id)
    if result:
        print("Diarization Result (First 500 chars):")
        print(str(result)[:500])
        with open("test_api_result.json", "w") as f:
            json.dump(result, f, indent=2)

if __name__ == "__main__":
    main()
