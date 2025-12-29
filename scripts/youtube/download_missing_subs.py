import subprocess
import time
import sys
import os

ids = ['7i_E-wIZA7A', 'LZYEmAdie0E']
output_dir = 'temp_subs'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for video_id in ids:
    print(f"Downloading subs for {video_id}...")
    cmd = [
        'yt-dlp', 
        '--write-auto-subs', 
        '--skip-download', 
        '--output', f'{output_dir}/%(id)s', 
        f'https://www.youtube.com/watch?v={video_id}'
    ]
    
    retries = 3
    for i in range(retries):
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"Success for {video_id}")
            break
        except subprocess.CalledProcessError as e:
            print(f"Error downloading {video_id}: {e}")
            print(e.stderr)
            if "Too Many Requests" in e.stderr or "429" in e.stderr:
                wait_time = (i + 1) * 30
                print(f"Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                break
    
    time.sleep(10) # Nice delay between videos
