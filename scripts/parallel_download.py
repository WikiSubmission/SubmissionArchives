import subprocess
import os
import time
import sys
from concurrent.futures import ThreadPoolExecutor

urls = [
    "https://www.youtube.com/watch?v=iYEmqt9zjMo",
    "https://youtu.be/dQRAAWAjHzU?si=_NDEGTgfhWHjzYnQ",
    "https://youtu.be/aqkUBLa1JUE?si=CaluQRLzquRUIQL4",
    "https://youtu.be/ftvZkLUfLao?si=gXfSKYrRuEHSo9Uy",
    "https://youtu.be/UouRqqmb7vU?si=VtWQSkVArjZh4WTy",
    "https://youtu.be/vNAAqvF6LP8?si=hdyFZc91gUaHcczP",
    "https://youtu.be/1KLZxgpGMqs?si=rVrGJB6YNz2BTuyo",
    "https://youtu.be/a3U2yi6d7aU?si=FvOvceeTqBoa3CnY",
    "https://youtu.be/a3U2yi6d7aU?si=nV2FBwFRTfFKOKuW",
    "https://youtu.be/SOSm9-QAm40?si=WOz2rTOYy0gfG2hY",
    "https://youtu.be/o_WfE1OshIk?si=Lcu6TS45DQA1LvLY",
    "https://youtu.be/Tj6_bSDW2rM?si=T9j7RhIo8FvXmlJH",
    "https://youtu.be/j6WwnOk44MU?si=JPbKJyos80A9Jwf2",
    "https://youtu.be/svsc99GcUWw?si=T8RehKhEqZNvGrSW",
    "https://youtu.be/Qw0yy-tQgas?si=ImC6tF6hVKv43ZXJ",
    "https://youtu.be/UetFQPwuaGA?si=w0y06cFQ43Z4V24I"
]

output_dir = r"c:\Users\Jonathan\Desktop\RKM\downloaded_videos"

def download_url(url):
    max_retries = 50
    for i in range(max_retries):
        try:
            print(f"Starting download for: {url} (Attempt {i+1})")
            cmd = [
                "yt-dlp",
                "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "--merge-output-format", "mp4",
                "-o", os.path.join(output_dir, "%(title)s.%(ext)s"),
                "--retries", "10",
                "--fragment-retries", "10",
                url
            ]
            # Add timeout to prevent hanging forever
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600) # 10 minutes timeout per attempt
            
            if result.returncode == 0:
                print(f"Successfully downloaded: {url}")
                return
            else:
                print(f"Error downloading {url}: {result.stderr[-200:]}") # Print last 200 chars of error
                time.sleep(5)
        except subprocess.TimeoutExpired:
            print(f"Timeout downloading {url}, retrying...")
            time.sleep(5)
        except Exception as e:
            print(f"Exception downloading {url}: {e}")
            time.sleep(5)
    
    print(f"Failed to download {url} after {max_retries} attempts.")

# Reduced max_workers to 2
with ThreadPoolExecutor(max_workers=2) as executor:
    executor.map(download_url, urls)

print("All download tasks finished.")
