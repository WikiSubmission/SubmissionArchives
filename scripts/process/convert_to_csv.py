import csv
import os
from youtube_transcript_api import YouTubeTranscriptApi

video_ids = {
    '70': ('MA 70  —  Messenger Audio', 'aWeLCiqRb00'),
    '71': ('MA 71  —  Messenger Audio', '0dTCigrZI1o')
}

output_dir = "data/sources/playlists/audio-transcripts"
os.makedirs(output_dir, exist_ok=True)

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

ytt_api = YouTubeTranscriptApi()

for num, (title, vid) in video_ids.items():
    print(f"Fetching and converting MA {num}...")
    try:
        transcript_list = ytt_api.list(vid)
        transcript = transcript_list.find_transcript(['en-US', 'en'])
        data = transcript.fetch()
        
        # Save to CSV
        out_path = os.path.join(output_dir, f"{num} - {title}.csv")
        with open(out_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Video Title', 'Link', 'Start Time', 'End Time', 'Text', 'Speaker'])
            
            for item in data:
                start = item.start
                end = start + item.duration
                text = item.text.replace('\n', ' ')
                
                writer.writerow([
                    title,
                    f"https://www.youtube.com/watch?v={vid}",
                    format_time(start),
                    format_time(end),
                    text,
                    ""
                ])
        print(f"Saved {out_path}")
    except Exception as e:
        print(f"Failed for MA {num}: {e}")
