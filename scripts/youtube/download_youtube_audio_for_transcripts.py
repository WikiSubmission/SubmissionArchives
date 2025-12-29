import os
import glob
import subprocess

# Directories
VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\youtube_audio"

def download_youtube_audio():
    """Download audio from YouTube videos that match the VTT transcripts"""
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Find all VTT files
    vtt_files = glob.glob(os.path.join(VTT_DIR, "*.vtt"))
    
    print(f"Found {len(vtt_files)} VTT files\n")
    
    # Extract unique YouTube IDs
    youtube_ids = set()
    for vtt_path in vtt_files:
        basename = os.path.basename(vtt_path)
        # Extract YouTube ID (format: XX_YOUTUBE_ID.en-US.vtt or XX_YOUTUBE_ID.en-en-US.vtt)
        # Remove the number prefix and extension
        if '_' in basename:
            # Split by underscore and take everything after first underscore
            after_underscore = basename.split('_', 1)[1]
            # Remove .en-US.vtt, .en-en-US.vtt, .en-tr.vtt, etc.
            yt_id = after_underscore.split('.en')[0]
            if yt_id:  # Only add non-empty IDs
                youtube_ids.add(yt_id)
    
    print(f"Found {len(youtube_ids)} unique YouTube videos\n")
    
    downloaded = 0
    for yt_id in sorted(youtube_ids):
        youtube_url = f"https://www.youtube.com/watch?v={yt_id}"
        output_template = os.path.join(OUTPUT_DIR, f"{yt_id}.%(ext)s")
        
        print(f"Downloading: {yt_id}")
        
        try:
            # Use yt-dlp to download audio only
            subprocess.run([
                "yt-dlp",
                "-x",  # Extract audio
                "--audio-format", "mp3",  # Convert to MP3
                "--audio-quality", "0",  # Best quality
                "-o", output_template,
                youtube_url
            ], check=True, capture_output=True)
            
            print(f"  ✓ Downloaded\n")
            downloaded += 1
            
        except subprocess.CalledProcessError as e:
            print(f"  ✗ Error: {e}\n")
        except FileNotFoundError:
            print("  ✗ Error: yt-dlp not found. Please install: pip install yt-dlp\n")
            return
    
    print(f"\n✅ Downloaded {downloaded} out of {len(youtube_ids)} videos")
    print(f"   Audio files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    print("Downloading YouTube audio to match VTT transcripts...\n")
    download_youtube_audio()
