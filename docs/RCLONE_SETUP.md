# Rclone Setup Guide for Cloudflare R2

## 1. Install Rclone
```powershell
winget install Rclone.Rclone
```

## 2. Configure Rclone for R2
```powershell
rclone config
```

When prompted:
- **n** (New remote)
- **Name:** `r2`
- **Storage:** Type `5` (Amazon S3)
- **Provider:** Type `4` (Cloudflare R2)
- **env_auth:** Press Enter (No)
- **access_key_id:** Paste your R2 Access Key ID from .env.local
- **secret_access_key:** Paste your R2 Secret Access Key from .env.local
- **region:** Press Enter (leave blank)
- **endpoint:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
  - Replace `<ACCOUNT_ID>` with your R2_ACCOUNT_ID from .env.local
- **location_constraint:** Press Enter (leave blank)
- **acl:** Press Enter (leave blank)
- Press **y** to confirm
- Press **q** to quit

## 3. Upload Your Folders
```powershell
# Upload disorganized_sermons
rclone copy "C:\Users\Jonathan\OneDrive\Desktop\RK-Media\data\disorganized_sermons" r2:rkmediaassets/media/disorganized_sermons/ --progress

# Upload rk_video_programs
rclone copy "C:\Users\Jonathan\OneDrive\Desktop\RK-Media\data\rk_video_programs" r2:rkmediaassets/media/rk_video_programs/ --progress
```

## 4. Verify Upload
```powershell
# List files in R2
rclone ls r2:rkmediaassets/media/
```

## Benefits
- ✅ Uploads entire folders at once
- ✅ Handles large files reliably
- ✅ Shows progress
- ✅ Resumes if interrupted
- ✅ Much faster than web dashboard
