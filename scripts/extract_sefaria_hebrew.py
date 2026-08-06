#!/usr/bin/env python3
"""
Extract vocalized Hebrew text (niqqud) for all 39 Old Testament books from Sefaria API
and save structured JSON files under public/data/scriptures/ot/
"""

import json
import os
import re
import sys
import urllib.request
import time

BOOKS = [
    # Torah (5)
    {"id": "genesis", "name": "Genesis", "category": "Torah", "hebrew_title": "בְּרֵאשִׁית", "sefaria_name": "Genesis"},
    {"id": "exodus", "name": "Exodus", "category": "Torah", "hebrew_title": "שְׁמוֹת", "sefaria_name": "Exodus"},
    {"id": "leviticus", "name": "Leviticus", "category": "Torah", "hebrew_title": "וַיִּקְרָא", "sefaria_name": "Leviticus"},
    {"id": "numbers", "name": "Numbers", "category": "Torah", "hebrew_title": "בְּמִדְבַּר", "sefaria_name": "Numbers"},
    {"id": "deuteronomy", "name": "Deuteronomy", "category": "Torah", "hebrew_title": "דְּבָרִים", "sefaria_name": "Deuteronomy"},

    # Prophets / Nevi'im (21)
    {"id": "joshua", "name": "Joshua", "category": "Prophets", "hebrew_title": "יְהוֹשֻׁעַ", "sefaria_name": "Joshua"},
    {"id": "judges", "name": "Judges", "category": "Prophets", "hebrew_title": "שֹׁפְטִים", "sefaria_name": "Judges"},
    {"id": "1-samuel", "name": "1 Samuel", "category": "Prophets", "hebrew_title": "שְׁמוּאֵל א", "sefaria_name": "I_Samuel"},
    {"id": "2-samuel", "name": "2 Samuel", "category": "Prophets", "hebrew_title": "שְׁמוּאֵל ב", "sefaria_name": "II_Samuel"},
    {"id": "1-kings", "name": "1 Kings", "category": "Prophets", "hebrew_title": "מְלָכִים א", "sefaria_name": "I_Kings"},
    {"id": "2-kings", "name": "2 Kings", "category": "Prophets", "hebrew_title": "מְלָכִים ב", "sefaria_name": "II_Kings"},
    {"id": "isaiah", "name": "Isaiah", "category": "Prophets", "hebrew_title": "יְשַׁעְיָהוּ", "sefaria_name": "Isaiah"},
    {"id": "jeremiah", "name": "Jeremiah", "category": "Prophets", "hebrew_title": "יִרְמְיָהוּ", "sefaria_name": "Jeremiah"},
    {"id": "ezekiel", "name": "Ezekiel", "category": "Prophets", "hebrew_title": "יְחֶזְקֵאל", "sefaria_name": "Ezekiel"},
    {"id": "hosea", "name": "Hosea", "category": "Prophets", "hebrew_title": "הוֹשֵׁעַ", "sefaria_name": "Hosea"},
    {"id": "joel", "name": "Joel", "category": "Prophets", "hebrew_title": "יוֹאֵל", "sefaria_name": "Joel"},
    {"id": "amos", "name": "Amos", "category": "Prophets", "hebrew_title": "עָמוֹס", "sefaria_name": "Amos"},
    {"id": "obadiah", "name": "Obadiah", "category": "Prophets", "hebrew_title": "עֹבַדְיָה", "sefaria_name": "Obadiah"},
    {"id": "jonah", "name": "Jonah", "category": "Prophets", "hebrew_title": "יוֹנָה", "sefaria_name": "Jonah"},
    {"id": "micah", "name": "Micah", "category": "Prophets", "hebrew_title": "מִיכָה", "sefaria_name": "Micah"},
    {"id": "nahum", "name": "Nahum", "category": "Prophets", "hebrew_title": "נַחוּם", "sefaria_name": "Nahum"},
    {"id": "habakkuk", "name": "Habakkuk", "category": "Prophets", "hebrew_title": "חֲבַקּוּק", "sefaria_name": "Habakkuk"},
    {"id": "zephaniah", "name": "Zephaniah", "category": "Prophets", "hebrew_title": "צְפַנְיָה", "sefaria_name": "Zephaniah"},
    {"id": "haggai", "name": "Haggai", "category": "Prophets", "hebrew_title": "חַגַּי", "sefaria_name": "Haggai"},
    {"id": "zechariah", "name": "Zechariah", "category": "Prophets", "hebrew_title": "זְכַרְיָה", "sefaria_name": "Zechariah"},
    {"id": "malachi", "name": "Malachi", "category": "Prophets", "hebrew_title": "מַלְאָכִי", "sefaria_name": "Malachi"},

    # Writings / Ketuvim (13)
    {"id": "psalms", "name": "Psalms", "category": "Writings", "hebrew_title": "תְּהִלִּים", "sefaria_name": "Psalms"},
    {"id": "proverbs", "name": "Proverbs", "category": "Writings", "hebrew_title": "מִשְׁלֵי", "sefaria_name": "Proverbs"},
    {"id": "job", "name": "Job", "category": "Writings", "hebrew_title": "אִיּוֹב", "sefaria_name": "Job"},
    {"id": "song-of-songs", "name": "Song of Songs", "category": "Writings", "hebrew_title": "שִׁיר הַשִּׁירִים", "sefaria_name": "Song_of_Songs"},
    {"id": "ruth", "name": "Ruth", "category": "Writings", "hebrew_title": "רוּת", "sefaria_name": "Ruth"},
    {"id": "lamentations", "name": "Lamentations", "category": "Writings", "hebrew_title": "אֵיכָה", "sefaria_name": "Lamentations"},
    {"id": "ecclesiastes", "name": "Ecclesiastes", "category": "Writings", "hebrew_title": "קֹהֶלֶת", "sefaria_name": "Ecclesiastes"},
    {"id": "esther", "name": "Esther", "category": "Writings", "hebrew_title": "אֶסְתֵּר", "sefaria_name": "Esther"},
    {"id": "daniel", "name": "Daniel", "category": "Writings", "hebrew_title": "דָּנִיֵּאל", "sefaria_name": "Daniel"},
    {"id": "ezra", "name": "Ezra", "category": "Writings", "hebrew_title": "עֶזְרָא", "sefaria_name": "Ezra"},
    {"id": "nehemiah", "name": "Nehemiah", "category": "Writings", "hebrew_title": "נְחֶמְיָה", "sefaria_name": "Nehemiah"},
    {"id": "1-chronicles", "name": "1 Chronicles", "category": "Writings", "hebrew_title": "דִּבְרֵי הַיָּמִים א", "sefaria_name": "I_Chronicles"},
    {"id": "2-chronicles", "name": "2 Chronicles", "category": "Writings", "hebrew_title": "דִּבְרֵי הַיָּמִים ב", "sefaria_name": "II_Chronicles"},
]

API_URL = "https://www.sefaria.org/api/texts/{sefaria_name}?context=0&commentary=0"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data", "scriptures", "ot")

import html

def clean_html(text):
    if not isinstance(text, str):
        return ""
    # Unescape HTML entities (&nbsp;, &amp;, etc.)
    text = html.unescape(text)
    # Strip HTML tags like <b>, <i>, <span>
    clean = re.sub(r'<[^>]+>', '', text)
    # Remove raw Masoretic paragraph markers like {פ} and {ס}
    clean = re.sub(r'\{[פס]\}', '', clean)
    # Normalize whitespace
    return ' '.join(clean.split()).strip()

def fetch_book(book_info):
    name = book_info['sefaria_name']
    print(f"Fetching {book_info['name']}...")

    chapters = []
    ch = 1
    while True:
        ch_url = f"https://www.sefaria.org/api/texts/{name}.{ch}?context=0&commentary=0"
        ch_req = urllib.request.Request(ch_url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(ch_req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
        except Exception:
            # Reached past final chapter
            break

        raw_hebrew = data.get("he", [])
        raw_english = data.get("text", [])

        if not raw_hebrew and not raw_english:
            break

        if isinstance(raw_hebrew, str):
            raw_hebrew = [raw_hebrew]
        if isinstance(raw_english, str):
            raw_english = [raw_english]

        verses = []
        for v_idx, v_he in enumerate(raw_hebrew, start=1):
            clean_he = clean_html(v_he if isinstance(v_he, str) else "")
            v_en = raw_english[v_idx - 1] if v_idx - 1 < len(raw_english) and isinstance(raw_english[v_idx - 1], str) else ""
            clean_en = clean_html(v_en)
            verses.append({
                "verseNumber": v_idx,
                "hebrew": clean_he,
                "english": clean_en
            })

        chapters.append({
            "chapterNumber": ch,
            "verseCount": len(verses),
            "verses": verses
        })
        ch += 1
        time.sleep(0.02)

    formatted_book = {
        "id": book_info["id"],
        "name": book_info["name"],
        "hebrewTitle": book_info["hebrew_title"],
        "category": book_info["category"],
        "chapterCount": len(chapters),
        "chapters": chapters
    }

    return formatted_book

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    summary_catalog = []

    for book in BOOKS:
        result = fetch_book(book)
        if result:
            out_file = os.path.join(OUTPUT_DIR, f"{book['id']}.json")
            with open(out_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            summary_catalog.append({
                "id": book["id"],
                "name": book["name"],
                "hebrewTitle": book["hebrew_title"],
                "category": book["category"],
                "chapterCount": result["chapterCount"]
            })
            print(f"  [OK] Saved {book['id']}.json ({result['chapterCount']} chapters)")
        time.sleep(0.1)

    catalog_path = os.path.join(OUTPUT_DIR, "catalog.json")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(summary_catalog, f, ensure_ascii=False, indent=2)

    print(f"\n[SUCCESS] All 39 Old Testament Hebrew books saved to {OUTPUT_DIR}")

if __name__ == '__main__':
    main()

