import os
import json
import re

TRANSCRIPT_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\quran-studies\transcripts"
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

def analyze():
    files = [f for f in os.listdir(TRANSCRIPT_DIR) if f.endswith('.json')]
    print(f"Found {len(files)} files.")

    results = []
    
    for f in files:
        path = os.path.join(TRANSCRIPT_DIR, f)
        try:
            with open(path, 'r', encoding='utf-8') as f_obj:
                data = json.load(f_obj)
                
                # Extract first non-trivial text chunks
                snippet = ""
                count = 0
                for seg in data:
                    text = seg.get('content') or seg.get('text') or ""
                    if text and len(text) > 5:
                        snippet += " " + text
                        count += 1
                        if count >= 3: break
                
                snippet = snippet.strip()[:200].replace('\n', ' ')
                results.append((f, snippet))
        except Exception as e:
            print(f"Error reading {f}: {e}")

    # Write results to file
    with open('scripts/uuid_map_dump.txt', 'w', encoding='utf-8') as out:
        for res in results:
            out.write(f"{res[0]} | {res[1]}\n")
    print("Dump written to scripts/uuid_map_dump.txt")

if __name__ == "__main__":
    analyze()
