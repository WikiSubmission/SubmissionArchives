
import os
import subprocess
import imageio_ffmpeg
import sys
import re
import json

# URLs and Titles
VIDEOS = [
    {"title": "Messenger Audio 2", "url": "https://www.youtube.com/watch?v=6-yFshRBpcQ"},
    {"title": "Messenger Audio 3.1 and 3.2", "url": "https://www.youtube.com/watch?v=x-FTCj3EPPI"},
    {"title": "Messenger Audio 4", "url": "https://www.youtube.com/watch?v=GqnPazpDQ-Y"},
    {"title": "Messenger Audio 5.1 and 5.2", "url": "https://www.youtube.com/watch?v=RJlRdRd-ZfY"},
    {"title": "Messenger Audio 7", "url": "https://www.youtube.com/watch?v=vFWMZvAfqkw"},
    {"title": "Messenger Audio 10.1 and 10.2 and 11", "url": "https://www.youtube.com/watch?v=rjuCvRFSHLo"},
    {"title": "Messenger Audio 12", "url": "https://www.youtube.com/watch?v=A1dhuhdFtvA"},
    {"title": "Messenger Audio 13", "url": "https://www.youtube.com/watch?v=VF4oOE0raI0"},
    {"title": "Messenger Audio 14.1 and 14.2", "url": "https://www.youtube.com/watch?v=NZVf3Y97icc"}
]

AUDIO_DIR = os.path.join(os.getcwd(), 'public', 'messenger_audios')
TRANSCRIPT_DIR = os.path.join(os.getcwd(), 'public', 'messenger_transcripts')
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def parse_vtt_time(time_str):
    """Converts HH:MM:SS.mmm to seconds (float)."""
    parts = re.split('[:.]', time_str)
    if len(parts) == 4:
        h, m, s, ms = map(int, parts)
        return h * 3600 + m * 60 + s + ms / 1000.0
    return 0.0

def convert_vtt_to_json(vtt_path, json_path, title):
    print(f"Converting {vtt_path} to {json_path}...")
    segments = []
    
    if not os.path.exists(vtt_path):
        print(f"VTT file not found: {vtt_path}")
        return

    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple VTT regex for blocks
    # 00:00:00.000 --> 00:00:01.757
    # Content...
    blocks = re.split(r'\n\n+', content)
    
    idx = 0
    for block in blocks:
        lines = [l.strip() for l in block.strip().split('\n') if l.strip()]
        if len(lines) < 2:
            continue
        
        # Check for timestamp line
        match = re.search(r'(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})', lines[0])
        if match:
            start_t = parse_vtt_time(match.group(1))
            end_t = parse_vtt_time(match.group(2))
            text = " ".join(lines[1:])
            
            # Clean up text (remove HTML-like tags if any)
            text = re.sub(r'<[^>]+>', '', text)
            
            # Try to extract speaker if present (e.g., "Dr. Khalifa: ...")
            speaker = ""
            speaker_match = re.match(r'^([^:]+):\s*(.*)', text)
            if speaker_match:
                speaker = speaker_match.group(1).strip()
                content_text = speaker_match.group(2).strip()
            else:
                content_text = text.strip()

            segments.append({
                "segment_index": idx,
                "start_time": start_t,
                "end_time": end_t,
                "content": content_text,
                "speaker": speaker
            })
            idx += 1

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(segments, f, indent=2)
    print(f"Saved {len(segments)} segments to {json_path}")

def download_audio_and_transcript(title, url):
    print(f"\n--- Processing: {title} ---")
    
    # Audio setup
    audio_file = os.path.join(AUDIO_DIR, f"{title}.mp3")
    
    # Transcript setup
    # yt-dlp downloads it as title.en-US.vtt or similar
    json_path = os.path.join(TRANSCRIPT_DIR, f"{title}.json")

    # Command for Audio (Extract and convert to mp3)
    audio_cmd = [
        sys.executable, "-m", "yt_dlp",
        "-x", 
        "--audio-format", "mp3",
        "--ffmpeg-location", FFMPEG_EXE,
        "-o", os.path.join(AUDIO_DIR, f"{title}.%(ext)s"),
        url
    ]
    
    # Command for Transcript (Write auto subs, skip video download)
    temp_vtt_tmpl = os.path.join(TRANSCRIPT_DIR, f"{title}.%(ext)s")
    transcript_cmd = [
        sys.executable, "-m", "yt_dlp",
        "--write-auto-subs",
        "--skip-download",
        "--sub-format", "vtt",
        "-o", temp_vtt_tmpl,
        url
    ]

    try:
        # Download Audio (if not already there)
        if not os.path.exists(audio_file):
            print(f"Downloading audio: {title}")
            subprocess.run(audio_cmd, check=True)
        else:
            print(f"Audio already exists: {title}")

        # Download Transcript (overwrite to get latest)
        print(f"Downloading transcript: {title}")
        subprocess.run(transcript_cmd, check=True)
        
        # Find the downloaded VTT file in TRANSCRIPT_DIR
        vtt_file = None
        for f in os.listdir(TRANSCRIPT_DIR):
            if f.startswith(title) and f.endswith('.vtt'):
                vtt_file = os.path.join(TRANSCRIPT_DIR, f)
                break
        
        if vtt_file:
            convert_vtt_to_json(vtt_file, json_path, title)
            os.remove(vtt_file) # Cleanup VTT
        else:
            print(f"No VTT file found for {title}")

    except subprocess.CalledProcessError as e:
        print(f"Error processing {video['title']}: {e}")

def main():
    if not os.path.exists(AUDIO_DIR):
        os.makedirs(AUDIO_DIR)
    if not os.path.exists(TRANSCRIPT_DIR):
        os.makedirs(TRANSCRIPT_DIR)
        
    for video in VIDEOS:
        download_audio_and_transcript(video['title'], video['url'])

if __name__ == "__main__":
    main()
