import re
import json
import os

# Manual list of the 50 items based on previous steps and `playlist_full.txt`
# I will reconstruct the list here to ensure I have the specific 50 items.
# (Note: I'll include the 3 recovered ones which might not be in playlist_full.txt yet or need manual addition)

items = [
    # VIDEO PROGRAMS (1-11, 34, 45-50)
    "media/VIDEO PROGRAMS/temp_1_01 What Life is All About & Who is GOD.mp4",
    "media/VIDEO PROGRAMS/temp_2_02 Witness a Miracle & World News Bulletin.mp4",
    "media/VIDEO PROGRAMS/temp_3_03 Mathematical Miracle of Quran.mp4",
    "media/VIDEO PROGRAMS/temp_4_04 Essentials of Submission Islam.mp4",
    "media/VIDEO PROGRAMS/temp_5_05 Principles of Contact Prayers Salat.mp4",
    "media/VIDEO PROGRAMS/temp_6_06 Principles of Friday Prayer.mp4",
    "media/VIDEO PROGRAMS/temp_7_07. Old Message, New Messenger.mp4",
    "media/VIDEO PROGRAMS/temp_8_08.The Great Debate： Dr. Rashad Khalifa vs Dr. Abdel Rahman.mp4",
    "media/VIDEO PROGRAMS/temp_9_09 In Defence of the Bible.mp4",
    "media/VIDEO PROGRAMS/temp_10_10 Evolution or Creation, The Final Argument by Dr Rashad Khalifa.mp4",
    "media/VIDEO PROGRAMS/temp_11_11 King of Chaos.mp4",
    "media/VIDEO PROGRAMS/temp_34_34 United Submitters International Conference Explaining the Fullfillment of the Covenant 1988.mp4",
    "media/VIDEO PROGRAMS/temp_45_45 United Submitters International Conference Final Speech by dr Rashad Khalifa 1989.mp4",
    "media/VIDEO PROGRAMS/temp_46_46 City Council al fateha Recitation by Rashad Khalifa.mp4",
    "media/VIDEO PROGRAMS/temp_47_47 Excerpts From a Radio Debate With dr Rashad Khalifa.mp4",
    "media/VIDEO PROGRAMS/temp_48_48 World News Bulletin.mp4",
    "media/VIDEO PROGRAMS/temp_49_49 The Creators Signature.mp4",
    "media/VIDEO PROGRAMS/temp_50_Arabic Language Lessons   By Dr  Rashad Khalifa Ph D.mp4",

    # FRIDAY SERMONS (12-33, 35-44) + Recovered 15,17,20
    "media/FRIDAY SERMONS/temp_12_12 Friday Sermon by dr Rashad Khalifa the Most Important Sermon GOD is Doing Everything 1987 06 05.mp4",
    "media/FRIDAY SERMONS/temp_13_13 Friday Sermon by dr Rashad Khalifa GOD is Doing Everything Rearranging Our Priorities 1987 07 No2.mp4",
    "media/FRIDAY SERMONS/temp_14_14 Friday Sermon by dr Rashad Khalifa Quran vs Bible Code End of the World Revealed 2280AD 1987 07 N.mp4",
    "media/FRIDAY SERMONS/temp_15_15 Friday Sermon by dr Rashad Khalifa Universal Unity Through Devotion to GOD Alone.mp4", # Recovered
    "media/FRIDAY SERMONS/temp_16_16 Friday Sermon by dr Rashad Khalifa the Mathematical Miracle Proves the Quran to be the Word of GO.mp4",
    "media/FRIDAY SERMONS/temp_17_17 Friday Sermon by dr Rashad Khalifa Evidence is Increasing This Life is a School for the Eternal Life.mp4", # Recovered
    "media/FRIDAY SERMONS/temp_18_18 Friday Sermon by dr Rashad Khalifa Quran is the Only Book in the World That is Mathematically Com.mp4",
    "media/FRIDAY SERMONS/temp_19_19 Friday Sermon by dr Rashad Khalifa More Evidence There is Meaning in Relations Between Numbers 19.mp4",
    "media/FRIDAY SERMONS/temp_20_20 Friday Sermon by dr Rashad Khalifa the Mohammadans Discoveries by Atef and Lisa 1987 12 04.mp4", # Recovered
    "media/FRIDAY SERMONS/temp_21_21 Friday Sermon by dr Rashad Khalifa the Power of Repentence the Secret of Happiness GOD Controls E.mp4",
    "media/FRIDAY SERMONS/temp_22_22 Friday Sermon by dr Rashad Khalifa GOD is Doing Everything Story About Ahmed Subhy Mansour 1988 0.mp4",
    "media/FRIDAY SERMONS/temp_23_23 Friday Sermon by dr Rashad Khalifa Our Purpose GOD's Kingdom vs Satan's Kingdom Abraham's Dream 1.mp4",
    "media/FRIDAY SERMONS/temp_24_24 Friday Sermon by dr Rashad Khalifa Seek GOD's Kingship Over You and Everything Else Follows 1988.mp4",
    "media/FRIDAY SERMONS/temp_25_25   Friday Sermon by Dr  Rashad Khalifa   Marriage    Importance of Love    Muhammad's Example.mp4",
    "media/FRIDAY SERMONS/temp_26_26 Friday Sermon by dr Rashad Khalifa Rashad Proclaims His Messengership Abraham's Religion 1988 04.mp4",
    "media/FRIDAY SERMONS/temp_27_27 Friday Sermon by dr Rashad Khalifa Rashad Explains His Messengership Details About Commandments Q.mp4",
    "media/FRIDAY SERMONS/temp_28_28 Friday Sermon by dr Rashad Khalifa Natural Instinct Who is the Real You How to Find Perfect Happi.mp4",
    "media/FRIDAY SERMONS/temp_29_29 Friday Sermon by dr Rashad Khalifa The Meaning of Life Discovering the Miracle Satan Created Reli.mp4",
    "media/FRIDAY SERMONS/temp_30_30 Friday Sermon by dr Rashad Khalifa Who is GOD Understanding Our Universe 1988 08 04.mp4",
    "media/FRIDAY SERMONS/temp_31_31 Friday Sermon by dr Rashad Khalifa Who is Your GOD Majority of Believers Are Going to Hell 1988 1.mp4",
    "media/FRIDAY SERMONS/temp_32_32 Friday Sermon by dr Rashad Khalifa Classification of Creatures Loving GOD Hell is not Enough 1988.mp4",
    "media/FRIDAY SERMONS/temp_33_33 Friday Sermon by dr Rashad Khalifa What About Previous Generations Messenger of the Covenant 1988.mp4",
    "media/FRIDAY SERMONS/temp_35_35 Friday Sermon by dr Rashad Khalifa Remember GOD Constantly Submitter vs Objector 1989 01 13.mp4",
    "media/FRIDAY SERMONS/temp_36_36 Friday Sermon by dr Rashad Khalifa Revelation of Quran to Revelation of Miracle Importance of Daw.mp4",
    "media/FRIDAY SERMONS/temp_37_37 Friday Sermon by dr Rashad Khalifa Original Sin Only GOD Guides Majority of Believers Are Going t.mp4",
    "media/FRIDAY SERMONS/temp_38_38 Friday Sermon by dr Rashad Khalifa Purpose of Messengers the Advent of the Pure Quran 1989 03 17.mp4",
    "media/FRIDAY SERMONS/temp_39_39 Friday Sermon by dr Rashad Khalifa Why Announce Messengership 1989 08 11.mp4",
    "media/FRIDAY SERMONS/temp_40_40 Friday Sermon by dr Rashad Khalifa Proving Every Verse Word Letter with Irrefutable Evidence 1989.mp4",
    "media/FRIDAY SERMONS/temp_41_41 Friday Sermon by dr Rashad Khalifa the Heavenly Feud the Importance of Killing the Ego 1989 09 29.mp4",
    "media/FRIDAY SERMONS/temp_42_42 Friday Sermon by dr Rashad Khalifa Proving Salat al Juma the Righteous Go Straight to Heaven 1989.mp4",
    "media/FRIDAY SERMONS/temp_43_43 Friday Sermon by dr Rashad Khalifa Miracle of Miracles al fateha Proving the Five Salat 1989 12 0.mp4",
    "media/FRIDAY SERMONS/temp_44_44 United Submitters International Conference Friday Sermon by dr Rashad Khalifa 1989.mp4",
]

def clean_title(filename):
    name = os.path.basename(filename)
    base, ext = os.path.splitext(name)

    # 1. Remove temp_XX_XX prefix
    base = re.sub(r'^temp_\d+_\d+\s*', '', base)

    # 2. Remove "Friday Sermon by dr Rashad Khalifa" variants
    base = re.sub(r'Friday Sermon by [Dd]r\.? Rashad Khalifa', '', base, flags=re.IGNORECASE)
    base = re.sub(r'Friday Sermon by [Dd]r\.?  Rashad Khalifa', '', base, flags=re.IGNORECASE)

    # 3. Clean specific video program artifacts
    base = re.sub(r'^\d+\.\s*', '', base) # Remove "07. "
    base = re.sub(r'^\d+\s+', '', base)   # Remove "09 "
    
    # 4. Remove purely numerical ending dates (optional, but keeps title clean)
    # The user wants "Actual Title", dates usually part of metadata.
    # However, for uniqueness, let's keep them if they are truly part of the title line in the original file, 
    # but strictly speaking, "The Most Important Sermon... 1987 06 05" -> "The Most Important Sermon..." looks cleaner.
    # But let's try to just clean the obvious junk.
    base = re.sub(r'\s+\d{4}\s\d{2}\s\d{2}.*$', '', base) # Remove trailing dates 1987 06 05
    base = re.sub(r'\s+198\d\s*$', '', base) # Remove trailing years " 1988"
    
    # 5. Clean up extra spaces and punctuation
    base = base.replace('Ph D', '').replace('  ', ' ').strip()
    base = base.strip('.-_')

    # Specific Fixes based on known titles
    if "United Submitters International Conference Explaining" in filename:
        base = "Explaining the Fulfillment of the Covenant"
    elif "United Submitters International Conference Final Speech" in filename:
        base = "Final Speech by Dr. Rashad Khalifa (1989 Conference)"
    elif "United Submitters International Conference Friday Sermon" in filename:
        base = "1989 Conference Friday Sermon"
    elif "The Great Debate" in filename:
        base = "The Great Debate Dr. Rashad Khalifa vs Dr. Abdel Rahman"
    elif "City Council al fateha Recitation" in filename:
        base = "City Council Al-Fateha Recitation"
    elif "Arabic Language Lessons" in filename:
        base = "Arabic Language Lessons"
    
    return base + ext

mapping = []
for item in items:
    new_name = clean_title(item)
    # Keep folder
    folder = os.path.dirname(item)
    new_path = f"{folder}/{new_name}"
    
    # Manual Override for specific clarity if regex failed
    if "temp_15_15" in item:
        new_path = f"{folder}/Universal Unity Through Devotion to GOD Alone.mp4"
    if "temp_17_17" in item:
        new_path = f"{folder}/Evidence is Increasing This Life is a School for the Eternal Life.mp4"
    if "temp_20_20" in item:
         new_path = f"{folder}/The Mohammadans Discoveries by Atef and Lisa.mp4"

    mapping.append({"old": item, "new": new_path})

with open('rename_map.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, indent=2)
