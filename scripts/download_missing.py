import subprocess
import os

# URLs from the playlist
videos = [
    {
        "url": "https://www.youtube.com/watch?v=_Ll4qVZof-8",
        "output": "downloads/temp_15_15 Friday Sermon by dr Rashad Khalifa Universal Unity Through Devotion to GOD Alone.mp4"
    },
    {
        "url": "https://www.youtube.com/watch?v=IosZLCyLshg",
        "output": "downloads/temp_17_17 Friday Sermon by dr Rashad Khalifa Evidence is Increasing This Life is a School for the Eternal Life.mp4"
    },
    {
        "url": "https://www.youtube.com/watch?v=eV39kJ4M28g",
        "output": "downloads/temp_20_20 Friday Sermon by dr Rashad Khalifa the Mohammadans Discoveries by Atef and Lisa 1987 12 04.mp4"
    }
]

if not os.path.exists('downloads'):
    os.makedirs('downloads')

for v in videos:
    print(f"Downloading {v['output']}...")
    try:
        cmd = [
            "python", "-m", "yt_dlp",
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4",
            "-o", v['output'],
            v['url']
        ]
        subprocess.run(cmd, check=True)
        print("Success.")
    except Exception as e:
        print(f"Failed to download {v['output']}: {e}")
