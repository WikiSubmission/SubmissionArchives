
import os
import re
import json
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

OUTPUT_DIR = "recovery_output"

def vtt_to_json(vtt_file):
    captions = []
    try:
        if not os.path.exists(vtt_file): return []
        for caption in webvtt.read(vtt_file):
            captions.append({
                "start": caption.start_in_seconds,
                "end": caption.end_in_seconds,
                "text": caption.text.replace('\n', ' ')
            })
    except Exception as e:
        print(f"Error parsing VTT {vtt_file}: {e}")
    return captions

print(f"Scanning {OUTPUT_DIR} for downloaded files...")

processed_count = 0
for filename in os.listdir(OUTPUT_DIR):
    # Only process files that have "_temp_" in them (meaning they haven't been renamed yet)
    # And specifically MP3s that don't have a corresponding .part file (completed)
    if "_temp_" in filename and filename.endswith(".mp3"):
        # Check for .part
        part_file = filename + ".part"
        # Also check for .webm.part in case conversion is pending
        webm_part = filename.replace(".mp3", ".webm.part")
        
        if os.path.exists(os.path.join(OUTPUT_DIR, part_file)):
            print(f"Skipping {filename} (download in progress - .part exists)")
            continue

        # Match index
        match = re.search(r"^(\d+)_temp_", filename)
        if match:
            index = int(match.group(1))
            if index in RENAME_MAP:
                new_title = RENAME_MAP[index]
                new_filename = f"{index}) Quran Study - {new_title}.mp3"
                
                # Sanitize new filename just in case
                new_filename = re.sub(r'[<>:"/\\|?*]', '', new_filename)
                
                old_path = os.path.join(OUTPUT_DIR, filename)
                new_path = os.path.join(OUTPUT_DIR, new_filename)
                
                # Check for long paths
                if len(os.path.abspath(new_path)) > 255:
                     # fallback to shorter name
                     new_filename = f"{index}) Quran Study.mp3"
                     new_path = os.path.join(OUTPUT_DIR, new_filename)

                print(f"Processing #{index}: {filename} -> {new_filename}")
                
                # Check for VTT first
                base_name = os.path.splitext(filename)[0]
                vtt_candidates = [f"{base_name}.en.vtt", f"{base_name}.vtt"]
                
                found_vtt = None
                for cand in vtt_candidates:
                    if os.path.exists(os.path.join(OUTPUT_DIR, cand)):
                        found_vtt = cand
                        break
                
                # Rename MP3
                try:
                    if os.path.exists(new_path):
                        print(f"  Target {new_filename} already exists. Skipping rename.")
                    else:
                        os.rename(old_path, new_path)
                except OSError as e:
                    print(f"Rename failed: {e}")
                    # Try copying/moving via shutil if rename fails across bounds (unlikely but possible)
                    import shutil
                    try:
                        shutil.move(old_path, new_path)
                    except Exception as e2:
                        print(f"Move also failed: {e2}")
                    continue

                if found_vtt:
                    vtt_path = os.path.join(OUTPUT_DIR, found_vtt)
                    json_filename = new_filename.replace(".mp3", ".json")
                    json_path = os.path.join(OUTPUT_DIR, json_filename)
                    
                    print(f"  Converting transcript: {found_vtt}")
                    captions = vtt_to_json(vtt_path)
                    if captions:
                         with open(json_path, 'w', encoding='utf-8') as f:
                            json.dump(captions, f, indent=2)
                    
                    # Store mapping logic to avoid duplicate processing? 
                    # Renaming handles it - _temp_ is gone.
                else:
                    print("  No transcript found.")
                
                processed_count += 1

print(f"Processed {processed_count} files.")
