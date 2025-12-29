import os
import hashlib
from collections import defaultdict

# Root directory
ROOT = r"c:\Users\Jonathan\Desktop\RKM"

def get_file_hash(filepath):
    """Get MD5 hash of first 1MB of file (for quick duplicate detection)"""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read(1024 * 1024)).hexdigest()
    except:
        return None

def scan_media_files():
    """Scan for all MP3 and MP4 files"""
    
    media_files = {
        'mp3': [],
        'mp4': []
    }
    
    # Scan directories
    for root, dirs, files in os.walk(ROOT):
        # Skip certain directories
        if any(skip in root for skip in ['.git', '__pycache__', 'node_modules', '.gemini']):
            continue
        
        for file in files:
            ext = file.lower().split('.')[-1]
            if ext in ['mp3', 'mp4']:
                filepath = os.path.join(root, file)
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                rel_path = os.path.relpath(filepath, ROOT)
                
                media_files[ext].append({
                    'name': file,
                    'path': filepath,
                    'rel_path': rel_path,
                    'size_mb': round(size_mb, 2),
                    'hash': get_file_hash(filepath)
                })
    
    return media_files

def find_duplicates(files):
    """Find duplicate files by hash"""
    hash_map = defaultdict(list)
    
    for file in files:
        if file['hash']:
            hash_map[file['hash']].append(file)
    
    duplicates = {h: f for h, f in hash_map.items() if len(f) > 1}
    return duplicates

def main():
    print("Scanning for MP3 and MP4 files...\n")
    
    media = scan_media_files()
    
    # Print MP3 files
    print(f"=" * 80)
    print(f"MP3 FILES ({len(media['mp3'])} total)")
    print(f"=" * 80)
    
    # Group by directory
    mp3_by_dir = defaultdict(list)
    for f in media['mp3']:
        dir_name = os.path.dirname(f['rel_path'])
        mp3_by_dir[dir_name].append(f)
    
    total_mp3_size = 0
    for dir_name in sorted(mp3_by_dir.keys()):
        files = mp3_by_dir[dir_name]
        dir_size = sum(f['size_mb'] for f in files)
        total_mp3_size += dir_size
        
        print(f"\n📁 {dir_name}/")
        print(f"   Files: {len(files)} | Size: {dir_size:.1f} MB")
        
        for f in sorted(files, key=lambda x: x['name'])[:5]:  # Show first 5
            print(f"   - {f['name']} ({f['size_mb']} MB)")
        
        if len(files) > 5:
            print(f"   ... and {len(files) - 5} more files")
    
    print(f"\n📊 Total MP3: {len(media['mp3'])} files, {total_mp3_size:.1f} MB")
    
    # Print MP4 files
    print(f"\n{'=' * 80}")
    print(f"MP4 FILES ({len(media['mp4'])} total)")
    print(f"=" * 80)
    
    mp4_by_dir = defaultdict(list)
    for f in media['mp4']:
        dir_name = os.path.dirname(f['rel_path'])
        mp4_by_dir[dir_name].append(f)
    
    total_mp4_size = 0
    for dir_name in sorted(mp4_by_dir.keys()):
        files = mp4_by_dir[dir_name]
        dir_size = sum(f['size_mb'] for f in files)
        total_mp4_size += dir_size
        
        print(f"\n📁 {dir_name}/")
        print(f"   Files: {len(files)} | Size: {dir_size:.1f} MB")
        
        for f in sorted(files, key=lambda x: x['name'])[:5]:
            print(f"   - {f['name']} ({f['size_mb']} MB)")
        
        if len(files) > 5:
            print(f"   ... and {len(files) - 5} more files")
    
    print(f"\n📊 Total MP4: {len(media['mp4'])} files, {total_mp4_size:.1f} MB")
    
    # Check for duplicates
    print(f"\n{'=' * 80}")
    print("DUPLICATE DETECTION")
    print(f"=" * 80)
    
    mp3_dupes = find_duplicates(media['mp3'])
    mp4_dupes = find_duplicates(media['mp4'])
    
    if mp3_dupes:
        print(f"\n⚠️  Found {len(mp3_dupes)} sets of duplicate MP3 files:")
        for hash_val, files in list(mp3_dupes.items())[:5]:
            print(f"\n  Duplicate set ({files[0]['size_mb']} MB each):")
            for f in files:
                print(f"    - {f['rel_path']}")
    else:
        print("\n✓ No duplicate MP3 files found")
    
    if mp4_dupes:
        print(f"\n⚠️  Found {len(mp4_dupes)} sets of duplicate MP4 files:")
        for hash_val, files in list(mp4_dupes.items())[:5]:
            print(f"\n  Duplicate set ({files[0]['size_mb']} MB each):")
            for f in files:
                print(f"    - {f['rel_path']}")
    else:
        print("\n✓ No duplicate MP4 files found")
    
    # Summary
    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print(f"={'=' * 80}")
    print(f"Total MP3 files: {len(media['mp3'])} ({total_mp3_size:.1f} MB)")
    print(f"Total MP4 files: {len(media['mp4'])} ({total_mp4_size:.1f} MB)")
    print(f"Total size: {total_mp3_size + total_mp4_size:.1f} MB")
    print(f"Duplicate MP3 sets: {len(mp3_dupes)}")
    print(f"Duplicate MP4 sets: {len(mp4_dupes)}")

if __name__ == "__main__":
    main()
