
import yt_dlp

# Candidate 1 (from recover script)
PLAYLIST_1 = "https://youtube.com/playlist?list=PL4-yu8H59XsykMGF0NTqhbUSs5yFoEzgO"
# Candidate 2 (from download script)
PLAYLIST_2 = "https://youtube.com/playlist?list=PL4-yu8H59XsxBcN-P_tfVwG8Ze72zEy5Y"

def check_playlist(url, name):
    print(f"Checking {name}...")
    ydl_opts = {
        'extract_flat': True,
        'playlist_items': '1-3',
        'quiet': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            if 'entries' in info:
                for i, entry in enumerate(info['entries']):
                    print(f"  {i+1}: {entry.get('title')}")
            else:
                print("  No entries found.")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    check_playlist(PLAYLIST_1, "Playlist 1 (FoEzgO)")
    check_playlist(PLAYLIST_2, "Playlist 2 (Ey5Y)")
