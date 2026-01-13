import os
import json
import re
import shutil

TRANSCRIPT_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\quran-studies\transcripts"
OUTPUT_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\recovery_output"
UUID_DUMP = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\scripts\uuid_map_dump.txt"

# 1. Load the Map of Expected Titles
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

MANUAL_OVERRIDES = {
    # UUID -> ID
    "030cfda5-4219-4577-8ccd-6a14d533be89.json": 22, # [39:15] matches Q.39:11 in #22 (or #46 but #22 title explicitly starts with it?) No, #22 is Q.39:11. #46 is Q.37:159.
    "07101d2a-8099-4222-bf1b-fc0a7a9cf92f.json": 15, # [54:23] -> Q.54 in #15
    "1dd444ed-577b-4be6-9e12-8768ae41c591.json": 3,  # [10:68] -> Q.10:79 is close? No, Sura 10. #3 is Q.10:79-92. 
    "bae1fbef-3d5a-4026-b4de-d35c269069bf.json": 25, # [58:3] -> Q.58 #25
    "be31dcef-bc02-4d6f-aad5-0c52027be4f7.json": 19, # [2:89] -> #19
    "9caf431b-09b7-4255-887d-d06aaed96a3f.json": 31, # [18:98] -> #31
    "9c80976b-a1f8-471d-af23-ad19efa03a60.json": 28, # [45:33] -> #28 (could be #30 but #28 is dedicated)
    "885d55fa-688b-499d-9e1e-7c18bdb9f9dd.json": 30, # [28:6] -> #30 (Starts with Q.28)
    "7490e2b5-72f0-4e44-88bc-f3286cef4085.json": 8,  # [65:10] -> #8 (Q.65)
    "932af70c-2d8f-4523-909d-617725309694.json": 36, # [30:25]
    "973a702e-d1f0-45d5-9a12-504fca367e5a.json": 16, # [64:1]
    "86de7dd1-e456-42ab-8e3e-7070e26cdb3e.json": 1,  # Catherine
    "09b9fcbd-8511-4b20-bb6f-eb483adb6ea6.json": 2,  # Quran Study 2 [95:1]
    "477b5794-fda8-44e0-afd8-cc39867e5260.json": 3,  # Quran Study 3 [10:79]
    # New findings from uuid_dump
    "b88ef8ba-c7a2-4a76-8b66-2afe56d1d4e2.json": 5, # "everything 57, look at the discount" -> #5 Q.56:75 & Q.57
    "4aba34cf-0de3-48b5-a2e1-d78a99b2faf2.json": 45, # "Sura 40, we're in Sura 40" -> #45 Q.40
    "5f40cfa7-af8a-43f8-b1c6-569e7a744a22.json": 7, # "sad faces... beautiful list of all the verses" -> #7 Q.62 & Q.63? Or #10? No, Hypocrites are in #6 (Q.59) or #7 (Q.63). Q.63 is Hypocrites.
    "c7e2d2ef-6580-4cb8-bd6d-0668bdefd6f4.json": 14, # "Zikr" -> #14 "Night of Destiny Zikr"
    "2f200865-505c-4525-9c66-0a9ab3a150d8.json": 23, # "Most Gracious... We're starting" -> #23 Q.51? Or #29 "Admission Test"? Let's hold on this.
    "885d55fa-688b-499d-9e1e-7c18bdb9f9dd.json": 30, # [28:6] -> #30 (Confirmed, it's already in the list but let's re-verify)
    "bb16b5d1-09cf-45b6-a873-24c69825acb4.json": 6, # "75 billion of us" -> Q.59 Invisible Giants? #6
    "4a36f92b-65e7-4d15-b24c-e05a2a3fc651.json": 2, # "Worship only the Omnipotent One" -> Q.96? Or #2 title "ink & Paper".
    # Added based on snippets:
    "f6821504-792d-4aa1-a36f-a62fbc16ffdf.json": 10, # "Sura 72, verse 6... jinns" - This was the imposter for #1. #10 title is "Q.71 & Q.72 - Chastity, Jinns". So this belongs to #10.
}

# 2. Extract Key Sura References from Titles to help matching
def get_sura_refs(title):
    # Find "Q.72:19" or "Q.72"
    refs = re.findall(r"Q\.(\d+)(?::(\d+))?", title)
    return [(int(r[0]), int(r[1]) if r[1] else None) for r in refs]

TITLE_REFS = {k: get_sura_refs(v) for k, v in RENAME_MAP.items()}

# 3. Read the Dump to get UUID snippets
uuid_snippets = {}
with open(UUID_DUMP, 'r', encoding='utf-8') as f:
    for line in f:
        if "|" in line:
            parts = line.split("|", 1)
            uuid_file = parts[0].strip()
            text = parts[1].strip()
            uuid_snippets[uuid_file] = text

# 4. Perform Matching
matches = {} # uuid_file -> id
assigned_ids = set()

print(f"Loaded {len(uuid_snippets)} snippets.")

# Strategy: Manual Overrides
for uuid_file in list(uuid_snippets.keys()):
    if uuid_file in MANUAL_OVERRIDES:
        id = MANUAL_OVERRIDES[uuid_file]
        matches[uuid_file] = id
        assigned_ids.add(id)
        print(f"MATCH (MANUAL): {uuid_file} -> #{id} ({RENAME_MAP[id]})")

# Strategy A: Precise Verse Match "[Sura:Verse]"
for uuid_file, text in uuid_snippets.items():
    if uuid_file in matches: continue
    # Regex for [39:15] or [54:23]
    verse_match = re.search(r"\[(\d+):(\d+)\]", text)
    if verse_match:
        sura = int(verse_match.group(1))
        verse = int(verse_match.group(2))
        
        # Determine which ID fits best
        best_id = None
        for id, refs in TITLE_REFS.items():
            if id in assigned_ids: continue
            
            # Check if this ID's title mentions this Sura
            # And potentially verse or close to it
            for (r_sura, r_verse) in refs:
                if r_sura == sura:
                    best_id = id
                    # If exact verse match (or close), prioritize
                    if r_verse and r_verse == verse:
                        best_id = id
                        break 
            if best_id: break
        
        if best_id:
            matches[uuid_file] = best_id
            assigned_ids.add(best_id)
            print(f"MATCH A: {uuid_file} -> #{best_id} based on [{sura}:{verse}] (Map: {RENAME_MAP[best_id]})")

# Strategy B: Fallback Text Matching
for uuid_file, text in uuid_snippets.items():
    if uuid_file in matches: continue
    
    # Try keywords
    text_lower = text.lower()
    
    for id, title in RENAME_MAP.items():
         if id in assigned_ids: continue
         
         # Heuristic Keywords
         if "blue quran" in text_lower and "blue quran" in title.lower():
             matches[uuid_file] = id
             assigned_ids.add(id)
             print(f"MATCH B: {uuid_file} -> #{id} based on 'Blue Quran'")
             break
         if "thamud" in text_lower and "54:23" in title: # Specific fix for 15
             matches[uuid_file] = id
             assigned_ids.add(id)
             print(f"MATCH B: {uuid_file} -> #{id} based on 'Thamud'")
             break
         # Add more as needed...

# 5. Execute Relocations
print("\n--- Relocating Files ---")
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

for uuid_file, id in matches.items():
    src = os.path.join(TRANSCRIPT_DIR, uuid_file)
    title = RENAME_MAP[id]
    # Clean filename same as before
    safe_title = re.sub(r'[<>:"/\\|?*]', '', title)
    dest_name = f"{id}) Quran Study - {safe_title}.json"
    dest = os.path.join(OUTPUT_DIR, dest_name)
    
    print(f"Copying {uuid_file} -> {dest_name}")
    try:
        shutil.copy2(src, dest)
    except Exception as e:
        print(f"Failed to copy: {e}")

print(f"\nTotal Matched: {len(matches)} / 52")
print("Remaining IDs:", sorted(list(set(RENAME_MAP.keys()) - assigned_ids)))
print("Remaining UUIDs:", len(uuid_snippets) - len(matches))
