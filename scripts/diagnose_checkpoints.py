import json
from collections import Counter
import glob
import os

# Find latest checkpoint or final file
files = [r"c:\Users\Jonathan\Desktop\RKM\data\1989_refined.json"]
if not files:
    print("No JSON files found.")
    exit()

latest_file = max(files, key=os.path.getmtime)
print(f"Analyzing file: {latest_file}")

with open(latest_file, 'r', encoding='utf-8') as f:
    verses = json.load(f)

print("=" * 60)
print("DIAGNOSTIC REPORT")
print("=" * 60)

# Basic counts
print(f"\n1. TOTAL VERSES FOUND: {len(verses)}")
print(f"   Expected: ~6,236")
print(f"   Missing: ~{6236 - len(verses)}")

# Chapter distribution
chapters = Counter(v.get('chapter_number') for v in verses)
print(f"\n2. CHAPTERS FOUND: {len(chapters)} / 114")
print(f"   Missing chapters: {set(range(1, 115)) - set(chapters.keys())}")

# Verses per chapter
print(f"\n3. TOP 10 CHAPTERS BY VERSE COUNT:")
for chapter, count in chapters.most_common(10):
    print(f"   Chapter {chapter}: {count} verses")

# Verse number analysis
verse_nums = [v.get('verse_number', 0) for v in verses]
if verse_nums:
    print(f"\n4. VERSE NUMBER RANGE: {min(verse_nums)} to {max(verse_nums)}")
    print(f"   Verses numbered '1': {verse_nums.count(1)}")
    print(f"   Verses numbered '2': {verse_nums.count(2)}")

# Sample verses
print(f"\n5. SAMPLE VERSES:")
for v in verses[:5]:
    text = v.get('text', '')[:50].replace('\n', ' ')
    print(f"   {v.get('verse_id', 'Unknown')}: {text}...")

# Check for page info
# Note: The current script might not be saving page_number in the JSON verses list, 
# but let's check if it exists or if we can infer it.
print("=" * 60)
