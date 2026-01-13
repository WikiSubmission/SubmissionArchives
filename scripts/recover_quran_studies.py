
import os
import json
import yt_dlp
import re
import webvtt

# RENAME MAP from rename-quran-studies.ts
RENAME_MAP = {
    1: "Q.72:19-28, Q.73 - Jinns (05-26-1989)",
    2: "Q.95 & Q.96 - Quran Is Not Ink & Paper (08-04-1989)",
    3: "Q.10:79-92, Q.73, Q.3:110-117, RK Sermon (01-19&26-1990)",
    4: "Q.37, Q.3:118-129 - Asteroid (01-21&22-1990)",
    5: "Q.56:75 & Q.57 (02-17-1989)",
    6: "Q.59 - PRA, Invisible Giants, Hypocrites (03-10-1989)",
    7: "Q.62 & Q.63 - God's Religion Will Dominate (03-24-1989)",
    8: "Q.65 & Q.66 - Enjoin Kids To Do Salat, Hamid Argues (04-07-1989)",
    9: "Q.70 - Chastity, Worry, Edip's Translation Request (05-12-1989)",
    10: "Q.71 & Q.72 - Chastity, Jinns (05-19-1989)",
    11: "Q.23:60-88, Q.16 (01-18&23&31-1990)",
    12: "Behrouz's Sermon & Edip's Exposure (01-25-1990)",
    13: "Q.7:12 - Adam & Eve's Bodies (12-24-1989)",
    14: "Night of Destiny Zikr",
    15: "Q.54:23, Q.55-56, Q.51 - Age 40 & First Gen",
    16: "Q.64, Q.59, Q.70 - Nothing Happens & Angels Are The Best Surgeons",
    17: "Q.82-83, Q.90-91 (07-21-1989)",
    18: "Q.61, Q.87, Q.94, Q.81",
    19: "Q.2:89 - Witchcraft, Reverting, Intro To Blue Quran",
    20: "Q.3 - Insurance, Worry, Fear",
    21: "Q.9:52, Q.56:75 - The Hypocrites",
    22: "Q.39:11, Q.37:164, Q.28 - Admission Test, No Insurance Compromise",
    23: "Q.51 - New Era, Believers Protected From Accidents & Diseases",
    24: "Q.55 & Q.56",
    25: "Q.58",
    26: "Q.67 - Hamid Argues With Rashad",
    27: "Q.14:18, Q.17:47 - Chastity, Salat As A Gift, DOJ, Quran Traps",
    28: "Q.45:33 - 19 Math",
    29: "1985 Tucson, Mehri's Questions, Admission Test & Final Test",
    30: "Q.28, Q.57, Q.45:33 - Insurance, Rashad Told To Devote All Time To God (01-1990)",
    31: "Q.18:98, Q.81 - Azan & Salat (11-04-1989)",
    32: "Q.22:15 - Which Masjids To Pray In",
    33: "Q.74 (06-02-1989)",
    34: "Q.33 - God Is Physical Innovations-Praying & Prostrating After Salat",
    35: "Rashad Makes Deliberate Mistakes To Destroy Idols (11-09-1989)",
    36: "Q.30:25 - Miracle From Biggest Brewery, Intercession, Allegory",
    37: "Q.11:68 (11-04-1989)",
    38: "Certainty (11-29)",
    39: "Q.60-61 - Rich Believer, Certainty, Insurance (12-28-1989)",
    40: "Q.3:59 (12-29-1989)",
    41: "Al-Fatiha For Everything You Wish, Extreme Libertarianism",
    42: "Interview W-Rashad by Ray Caton, Insurance, Interest",
    43: "Q.17:39 - 3rd Intl Conf, Rashad Speech, Insurance Based On Fear (11-1988)",
    44: "Q.64, Q.70 - Nothing Happens, Worry, Chastity",
    45: "Q.40 - Deja Vu, Old Believers Usually Finish All Affairs Before Departing",
    46: "Q.37:159, Q.38:25, Q.9:50, Q.39:11 - Admission Test, No Insurance Compromise, Jinns, Hypocrites, Apology",
    47: "Q.1, Q.2 - Intro to Blue Quran",
    48: "Rashad's Speech - Salat, Zakat, Fazeli Argues (01-11-1989)",
    49: "Rashad's Speech, 19 Math (11-05-1989)",
    50: "Q.92-94 - Zakat Not Limited To Earned Income",
    51: "Q.17:59 (1990)",
    52: "Q.1-2 (05-09-1989)"
}

PLAYLIST_URL = "https://youtube.com/playlist?list=PL4-yu8H59XsykMGF0NTqhbUSs5yFoEzgO"
OUTPUT_DIR = "recovery_output"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def vtt_to_json(vtt_file):
    captions = []
    try:
        for caption in webvtt.read(vtt_file):
            captions.append({
                "start": caption.start_in_seconds,
                "end": caption.end_in_seconds,
                "text": caption.text.replace('\n', ' ')
            })
    except Exception as e:
        print(f"Error parsing VTT {vtt_file}: {e}")
    return captions

def my_hook(d):
    if d['status'] == 'finished':
        print('Done downloading, now converting ...')

ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'writesubtitles': True,
    'subtitleslangs': ['en'],
    'writeautomaticsub': True, # Fallback
    'keepvideo': False, # Ensure video is deleted
    'playlist_items': '1-52',
    'outtmpl': f'{OUTPUT_DIR}/%(playlist_index)s_temp_%(title)s.%(ext)s',
    'progress_hooks': [my_hook],
    'download_archive': f'{OUTPUT_DIR}/download_archive.txt', # Skip already downloaded IDs
}

print("Starting download...")

# Pre-check for existing final files to skip
existing_indices = set()
for f in os.listdir(OUTPUT_DIR):
    match = re.search(r"^(\d+)\)", f)
    if match:
        existing_indices.add(int(match.group(1)))

print(f"skipping indices already processed: {sorted(list(existing_indices))}")

# We can't easily filter yt-dlp playlist items dynamically by index list in one go without complex start/end logic
# But 'download_archive' handles the "don't re-download source" part.
# To properly skip processing, we rely on the archive.


print("Starting Subtitle Download (Phase 1)...")
ydl_opts_subs = {
    'writesubtitles': False, # We have transcripts from GitHub
    'writeautomaticsub': False,
    'subtitlesformat': 'vtt',
    'skip_download': False, # ONLY subs
    'playlist_items': '1-52',
    'outtmpl': f'{OUTPUT_DIR}/%(playlist_index)s_temp_%(title)s.%(ext)s',
    'ignoreerrors': True,
}

# Phase 1 Disabled (Transcripts recovered via GitHub)
# with yt_dlp.YoutubeDL(ydl_opts_subs) as ydl:
#     ydl.download([PLAYLIST_URL])

print("Subtitle Download Complete. Converting Subs to JSON...")
# Convert VTTs immediately so we have them
for filename in os.listdir(OUTPUT_DIR):
    if filename.endswith(".vtt"):
        # e.g. 01_temp_... .en.vtt
        match = re.search(r"^(\d+)_temp_", filename)
        if match:
            index = int(match.group(1))
            if index in RENAME_MAP:
                new_title = RENAME_MAP[index]
                new_filename = f"{index}) Quran Study - {new_title}.json"
                json_path = os.path.join(OUTPUT_DIR, new_filename)
                
                print(f"Converting {filename} -> {new_filename}")
                vtt_path = os.path.join(OUTPUT_DIR, filename)
                try:
                    captions = vtt_to_json(vtt_path)
                    if captions:
                         with open(json_path, 'w', encoding='utf-8') as f:
                            json.dump(captions, f, indent=2)
                except Exception as e:
                    print(f"Failed to convert {filename}: {e}")

print("Starting Audio Download (Phase 2)...")
ydl_opts_audio = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'keepvideo': False, 
    'playlist_items': '32,46,47,48,49,50,51,52', # Target remaining missing files (45 is done)
    'outtmpl': f'{OUTPUT_DIR}/%(playlist_index)s_temp_%(title)s.%(ext)s',
    'progress_hooks': [my_hook],
    # 'download_archive': f'{OUTPUT_DIR}/download_archive.txt', # Disable archive to force download
    'sleep_interval': 5, # Aggressive speed up
    'max_sleep_interval': 10,
    'ignoreerrors': True,
    'file_access_retries': 3,
    'fragment_retries': 3,
    'concurrent_fragment_downloads': 5, # Speed up HLS
    'retry_sleep_functions': {'http': lambda x: 120}, 
    'extractor_args': {
        'youtube': {
            'player_client': ['web_safari'], # Bypasses PO Token for HLS
        }
    }
}

with yt_dlp.YoutubeDL(ydl_opts_audio) as ydl:
    ydl.download([PLAYLIST_URL])

print("Audio Download complete. Processing filenames...")

# Process files
for filename in os.listdir(OUTPUT_DIR):
    if filename.endswith(".mp3") and "_temp_" in filename:
        # Match playlist index
        match = re.search(r"^(\d+)_temp_", filename)
        if match:
            index = int(match.group(1))
            # ... existing logic

            
            # Check if we already have the final file
            if index in existing_indices:
                print(f"Skipping processing for #{index} (Final file already exists)")
                # Clean up temp file if it exists redundant
                try:
                    os.remove(os.path.join(OUTPUT_DIR, filename))
                except: pass
                continue

            if index in RENAME_MAP:
                new_title = RENAME_MAP[index]
                new_filename = f"{index}) Quran Study - {new_title}.mp3"
                
                old_path = os.path.join(OUTPUT_DIR, filename)
                new_path = os.path.join(OUTPUT_DIR, new_filename)
                
                print(f"Renaming {filename} -> {new_filename}")
                os.rename(old_path, new_path)
                
                # Look for associated VTT
                base_name = os.path.splitext(filename)[0] # remove .mp3
                # yt-dlp might append .en.vtt
                vtt_candidates = [
                    f"{base_name}.en.vtt",
                    f"{base_name}.vtt"
                ]
                
                found_vtt = None
                for cand in vtt_candidates:
                    if os.path.exists(os.path.join(OUTPUT_DIR, cand)):
                        found_vtt = cand
                        break
                
                if found_vtt:
                    vtt_path = os.path.join(OUTPUT_DIR, found_vtt)
                    json_filename = new_filename.replace(".mp3", ".json")
                    json_path = os.path.join(OUTPUT_DIR, json_filename)
                    
                    print(f"Converting {found_vtt} -> {json_filename}")
                    captions = vtt_to_json(vtt_path)
                    
                    with open(json_path, 'w', encoding='utf-8') as f:
                        json.dump(captions, f, indent=2)
                    
                    # Cleanup VTT
                    # os.remove(vtt_path)
                else:
                    print(f"Warning: No VTT found for {filename}")

print("Processing complete.")
