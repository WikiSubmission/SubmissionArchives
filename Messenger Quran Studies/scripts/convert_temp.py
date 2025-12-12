import os
import subprocess
import glob

def convert_temp_files():
    directory = 'Messenger Quran Studies'
    # Find all .temp.mp4 files
    temp_files = glob.glob(os.path.join(directory, '*.temp.mp4'))
    
    print(f"Found {len(temp_files)} temp files to convert.")
    
    for temp_file in temp_files:
        # Construct output filename (remove .temp.mp4 and add .mp3)
        output_file = temp_file.replace('.temp.mp4', '.mp3')
        
        print(f"Converting: {temp_file} -> {output_file}")
        
        try:
            # Call ffmpeg directly
            cmd = ['ffmpeg', '-y', '-i', temp_file, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', output_file]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Successfully converted: {output_file}")
                # Remove the temp file
                os.remove(temp_file)
                print(f"Removed temp file: {temp_file}")
            else:
                print(f"Failed to convert {temp_file}")
                print(result.stderr)
                
        except Exception as e:
            print(f"Error processing {temp_file}: {e}")

if __name__ == "__main__":
    convert_temp_files()
