import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import WebVTTFormatter
import os

video_ids = {
    '70': 'aWeLCiqRb00',
    '71': '0dTCigrZI1o'
}

formatter = WebVTTFormatter()
ytt_api = YouTubeTranscriptApi()

# Output dir based on general structure
output_dir = "public/content/audios/messenger-audios"
os.makedirs(output_dir, exist_ok=True)

for num, vid in video_ids.items():
    print(f"Fetching transcript for MA {num} (Video ID: {vid})...")
    try:
        transcript_list = ytt_api.list(vid)
        transcript = transcript_list.find_transcript(['en-US', 'en'])
        transcript_data = transcript.fetch()
        vtt_formatted = formatter.format_transcript(transcript_data)
        out_path = os.path.join(output_dir, f"MA{num}.en-US.vtt")
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(vtt_formatted)
        print(f"Successfully saved {out_path}")
    except Exception as e:
        print(f"Failed for MA {num}: {e}")
