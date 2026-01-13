
import yt_dlp
import os

OUTPUT_DIR = "reprocess_temp"
VIDEO_URL = "https://youtube.com/watch?v=cMoTZEsn7Iw"
INDEX = 33

def download_single():
    print(f"Downloading Video #{INDEX} from {VIDEO_URL}...")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{OUTPUT_DIR}/{INDEX}_%(id)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': False,
    }

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([VIDEO_URL])
        
    print("Done.")

if __name__ == "__main__":
    download_single()
