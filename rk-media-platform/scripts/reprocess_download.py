
import yt_dlp
import os

PLAYLIST_URL = "https://youtube.com/playlist?list=PL4-yu8H59XsykMGF0NTqhbUSs5yFoEzgO"
OUTPUT_DIR = "reprocess_temp"

def download_batch():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{OUTPUT_DIR}/%(playlist_index)s_%(id)s.%(ext)s',
        'playlist_items': '44-52',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        # Subtitle options
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'auto'],
        'sleep_interval': 10,
        'max_sleep_interval': 20, # Random sleep between 10-20s
        # json3 is the internal format which has word-level timestamps often, 
        # but vtt is safer. Let's try to get json3 if possible, else vtt.
        # yt-dlp might just save whatever it gets.
    }

    print("Starting download of items 1-52...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([PLAYLIST_URL])
    print("Download complete.")

if __name__ == "__main__":
    download_batch()
