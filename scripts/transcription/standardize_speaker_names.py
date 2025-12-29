import json
import os
import glob

# Directories to process
QURAN_STUDIES_TRANSCRIPTS = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
MESSENGER_AUDIOS_TRANSCRIPTS = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"

def standardize_speaker_names(transcript_path):
    """Replace 'The messenger' with 'Dr. Khalifa' in transcript"""
    with open(transcript_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    changed = False
    
    # Process segments
    if 'segments' in data:
        for seg in data['segments']:
            if seg.get('speaker') == 'The messenger':
                seg['speaker'] = 'Dr. Khalifa'
                changed = True
            
            # Also check words within segments
            if 'words' in seg:
                for word in seg['words']:
                    if word.get('speaker') == 'The messenger':
                        word['speaker'] = 'Dr. Khalifa'
                        changed = True
    
    # Process top-level words (if any)
    if 'words' in data:
        for word in data['words']:
            if word.get('speaker') == 'The messenger':
                word['speaker'] = 'Dr. Khalifa'
                changed = True
    
    # Process Deepgram format
    if 'results' in data and 'channels' in data['results']:
        for channel in data['results']['channels']:
            if 'alternatives' in channel:
                for alt in channel['alternatives']:
                    if 'words' in alt:
                        for word in alt['words']:
                            if word.get('speaker') == 'The messenger':
                                word['speaker'] = 'Dr. Khalifa'
                                changed = True
    
    return data, changed

def process_directory(directory):
    """Process all JSON files in a directory"""
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return 0, 0
    
    json_files = glob.glob(os.path.join(directory, "*.json"))
    processed = 0
    changed = 0
    
    for json_path in json_files:
        try:
            data, was_changed = standardize_speaker_names(json_path)
            
            if was_changed:
                # Create backup
                backup_path = json_path + '.bak'
                if not os.path.exists(backup_path):
                    import shutil
                    shutil.copy2(json_path, backup_path)
                
                # Save updated file
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                changed += 1
                print(f"✓ Updated: {os.path.basename(json_path)}")
            
            processed += 1
            
        except Exception as e:
            print(f"✗ Error processing {os.path.basename(json_path)}: {e}")
    
    return processed, changed

def main():
    print("Standardizing speaker names: 'The messenger' → 'Dr. Khalifa'\n")
    
    print("Processing Quran Studies transcripts...")
    qs_processed, qs_changed = process_directory(QURAN_STUDIES_TRANSCRIPTS)
    print(f"  Processed: {qs_processed}, Changed: {qs_changed}\n")
    
    print("Processing Messenger Audios transcripts...")
    ma_processed, ma_changed = process_directory(MESSENGER_AUDIOS_TRANSCRIPTS)
    print(f"  Processed: {ma_processed}, Changed: {ma_changed}\n")
    
    total_changed = qs_changed + ma_changed
    total_processed = qs_processed + ma_processed
    
    print(f"✅ Complete! Updated {total_changed} out of {total_processed} files")
    print(f"   Backups saved with .bak extension")

if __name__ == "__main__":
    main()
