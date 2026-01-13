
import reprocess_download
import reprocess_convert
import reprocess_upload
import time

def main():
    print("=== STEP 1: DOWNLOAD ===")
    try:
        reprocess_download.download_batch()
    except Exception as e:
        print(f"Download failed: {e}")
        # Continue? No, probably need files.
        # But maybe partial download is ok to process?
        # Let's verify file count?
        pass

    print("\n=== STEP 2: CONVERT & RENAME ===")
    try:
        reprocess_convert.main()
    except Exception as e:
        print(f"Conversion failed: {e}")

    print("\n=== STEP 3: UPLOAD ===")
    try:
        reprocess_upload.upload_files()
    except Exception as e:
        print(f"Upload failed: {e}")

    print("\n=== ALL DONE ===")

if __name__ == "__main__":
    main()
