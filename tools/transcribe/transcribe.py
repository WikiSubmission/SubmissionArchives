"""
Submission Archives — High-Accuracy Video Transcription Pipeline
================================================================
Downloads YouTube audio via yt-dlp & FFmpeg, uploads to Gemini 2.5 Flash via
Files API, and produces pristine timestamped transcripts, SRT subtitles, and
structured JSON. Accurately transcribes mixed English & Quranic Arabic with
[Quran X:Y] citations.

Usage:
    python transcribe.py URL [URL ...] [--model gemini-2.5-flash] [--out ./transcripts]
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types
import yt_dlp


def load_env_local():
    """Load GEMINI_API_KEY from .env.local if present in project root."""
    for env_name in [".env.local", ".env"]:
        env_file = Path(__file__).resolve().parent.parent.parent / env_name
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    if k and v and k not in os.environ:
                        os.environ[k] = v


def get_ffmpeg_path() -> str | None:
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(exe):
            ffmpeg_dir = str(Path(exe).parent)
            if ffmpeg_dir not in os.environ.get("PATH", ""):
                os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
            return exe
    except Exception:
        pass
    return None


def download_audio(url: str, out_dir: Path) -> tuple[Path, str, str, int]:
    """Download audio track from YouTube URL using yt-dlp and FFmpeg."""
    ffmpeg_exe = get_ffmpeg_path()

    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best",
        "http_chunk_size": 10485760,  # 10MB chunked streaming (avoids memory spikes on long videos)
        "extractor_args": {
            "youtube": {
                "player_client": ["web", "mweb", "ios", "android"]
            }
        },
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "outtmpl": str(out_dir / "%(id)s.%(ext)s"),
        "quiet": False,
        "no_warnings": True,
    }

    if ffmpeg_exe:
        ydl_opts["ffmpeg_location"] = ffmpeg_exe

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info["id"]
        title = info.get("title", video_id)
        duration = int(info.get("duration", 0))

    audio_path = out_dir / f"{video_id}.mp3"
    if not audio_path.exists():
        for ext in ["m4a", "wav", "opus", "webm", "mp4"]:
            alt = out_dir / f"{video_id}.{ext}"
            if alt.exists():
                audio_path = alt
                break

    print(f"[download] Title: {title} (Duration: {duration//60}m {duration%60}s)")
    print(f"[download] Audio file: {audio_path}")
    return audio_path, video_id, title, duration


SYSTEM_PROMPT = """You are a master transcriptionist and Islamic archival scholar for Submission Archives.

Your task is to produce a complete, verbatim, highly accurate transcript of the provided audio recording.

Strict Guidelines:
1. TIMESTAMPS: Insert timestamp markers in the format [MM:SS] (or [HH:MM:SS] for hours) at every natural paragraph break or topic transition (roughly every 20-45 seconds).
2. ACCURACY & PUNCTUATION: Use proper punctuation, sentence capitalization, commas, quotation marks, and paragraphs.
3. QURANIC ARABIC & SCRIPTURE:
   - When Arabic Quranic verses or Islamic phrases are recited, transcribe the Arabic text in Arabic script, followed by the English translation and scripture citation tag: [Quran X:Y].
   - Spell names accurately (e.g. Rashad Khalifa, Ahmed Deedat, Edip Yuksel, Surat Al-Muddathir, etc.).
4. VERBATIM FIDELITY: Do not summarize, skip, or omit speech. Capture the full spoken content faithfully.
5. CLEAN OUTPUT: Return ONLY the formatted transcript with timestamps. Do not add intro greetings, markdown fences, or closing commentary.
"""


def parse_timestamps_to_srt(transcript_text: str, total_duration: int = 0) -> str:
    """Convert timestamped transcript text into standard SRT subtitle format."""
    lines = [l.strip() for l in transcript_text.splitlines() if l.strip()]
    segments = []

    ts_pattern = re.compile(r"\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]")

    def ts_to_seconds(m: re.Match) -> float:
        parts = [int(p) for p in m.groups() if p is not None]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return parts[0] * 60 + parts[1]

    def format_srt_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    current_start = 0.0
    current_text_parts = []

    for line in lines:
        match = ts_pattern.search(line)
        if match:
            # Found timestamp marker
            if current_text_parts:
                seg_text = " ".join(current_text_parts).strip()
                if seg_text:
                    segments.append((current_start, seg_text))
                current_text_parts = []
            
            current_start = ts_to_seconds(match)
            # Remove the timestamp token from line
            clean_line = ts_pattern.sub("", line).strip()
            if clean_line:
                current_text_parts.append(clean_line)
        else:
            current_text_parts.append(line)

    if current_text_parts:
        seg_text = " ".join(current_text_parts).strip()
        if seg_text:
            segments.append((current_start, seg_text))

    if not segments:
        return ""

    srt_entries = []
    for i in range(len(segments)):
        start_sec = segments[i][0]
        if i + 1 < len(segments):
            end_sec = max(start_sec + 2.0, segments[i + 1][0] - 0.2)
        else:
            end_sec = max(start_sec + 5.0, float(total_duration) if total_duration else start_sec + 10.0)

        srt_entries.append(str(i + 1))
        srt_entries.append(f"{format_srt_time(start_sec)} --> {format_srt_time(end_sec)}")
        srt_entries.append(segments[i][1])
        srt_entries.append("")

    return "\n".join(srt_entries)


def transcribe_video_gemini(
    audio_path: Path,
    video_id: str,
    title: str,
    duration: int,
    out_dir: Path,
    client: genai.Client,
    model_name: str = "gemini-2.5-flash",
) -> Path:
    """Upload audio to Gemini Files API and transcribe."""
    print(f"\n[gemini] Uploading {audio_path.name} to Gemini Files API...")
    audio_file = client.files.upload(file=str(audio_path))
    print(f"[gemini] Uploaded as {audio_file.name}. Processing with {model_name}...")

    t0 = time.time()
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[
                audio_file,
                "Transcribe this entire recording with precise [MM:SS] timestamps and accurate Quranic Arabic verses."
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,  # Low temperature for verbatim fidelity
            ),
        )
        transcript_text = response.text.strip()
    finally:
        # Cleanup uploaded audio file from cloud storage
        try:
            client.files.delete(name=audio_file.name)
            print(f"[gemini] Cleaned up cloud file {audio_file.name}")
        except Exception:
            pass

    elapsed = time.time() - t0
    print(f"[gemini] Transcription completed in {elapsed:.1f}s")

    # Write formatted files
    txt_path = out_dir / "transcript.txt"
    txt_path.write_text(transcript_text, encoding="utf-8")

    srt_text = parse_timestamps_to_srt(transcript_text, duration)
    srt_path = out_dir / "transcript.srt"
    srt_path.write_text(srt_text, encoding="utf-8")

    meta_path = out_dir / "metadata.json"
    meta_data = {
        "video_id": video_id,
        "title": title,
        "duration_seconds": duration,
        "model": model_name,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    meta_path.write_text(json.dumps(meta_data, indent=2), encoding="utf-8")

    print(f"[output] Transcript (TXT): {txt_path}")
    print(f"[output] Subtitles (SRT):  {srt_path}")
    print(f"[output] Metadata (JSON):  {meta_path}")

    return out_dir


def process_url(url: str, base_dir: Path, client: genai.Client, model_name: str):
    """Process a single YouTube video URL end-to-end."""
    print(f"\n{'='*70}")
    print(f"Processing Video: {url}")
    print(f"{'='*70}")

    # Extract video ID from URL if possible to check if already completed
    vid_match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    if vid_match:
        quick_id = vid_match.group(1)
        quick_out = base_dir / quick_id
        if (quick_out / "transcript.txt").exists() and (quick_out / "transcript.srt").exists():
            print(f"[SKIP] Transcript already exists in {quick_out}. Skipping.")
            return

    tmp_audio_dir = base_dir / "_audio"
    tmp_audio_dir.mkdir(parents=True, exist_ok=True)

    audio_path, video_id, title, duration = download_audio(url, tmp_audio_dir)
    out_dir = base_dir / video_id
    out_dir.mkdir(parents=True, exist_ok=True)

    if (out_dir / "transcript.txt").exists() and (out_dir / "transcript.srt").exists():
        print(f"[SKIP] Transcript already exists in {out_dir}. Skipping.")
        return

    transcribe_video_gemini(
        audio_path=audio_path,
        video_id=video_id,
        title=title,
        duration=duration,
        out_dir=out_dir,
        client=client,
        model_name=model_name,
    )

    print(f"\n[SUCCESS] Completed {title} ({video_id})")


def main():
    load_env_local()
    parser = argparse.ArgumentParser(
        description="High-accuracy YouTube transcription pipeline using Gemini 2.5 Flash.",
    )
    parser.add_argument("urls", nargs="+", help="YouTube video URLs to transcribe")
    parser.add_argument("--model", default="gemini-2.5-flash", help="Gemini model name")
    parser.add_argument("--out", default="./transcripts", help="Output directory")
    parser.add_argument("--key", default=None, help="Gemini API Key (or set GEMINI_API_KEY)")

    args = parser.parse_args()

    api_key = args.key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY is required. Please set it in .env.local or pass --key.", file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    base_dir = Path(args.out)
    base_dir.mkdir(parents=True, exist_ok=True)

    total = len(args.urls)
    for idx, url in enumerate(args.urls, 1):
        print(f"\n>>> [{idx}/{total}] Starting: {url}")
        try:
            process_url(url, base_dir, client, args.model)
        except Exception as e:
            print(f"[ERROR] Failed to process {url}: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()

    print(f"\n{'='*70}")
    print(f"Batch transcription complete! All transcripts saved in: {base_dir.resolve()}")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
