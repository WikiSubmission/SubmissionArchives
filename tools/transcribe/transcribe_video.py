"""
High-Accuracy Live-Streaming Video Transcription using Gemini API & yt-dlp
==========================================================================
Transcribes YouTube video with live token streaming in the terminal, precise
timestamps, Quranic Arabic verses, and outputs TXT, SRT, VTT, and JSON.
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

# Ensure UTF-8 output across all platforms, especially Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from google import genai
from google.genai import types
import yt_dlp


def load_env_local():
    """Load GEMINI_API_KEY from .env.local or .env in project root."""
    current = Path(__file__).resolve().parent
    for _ in range(4):
        for env_name in [".env.local", ".env"]:
            env_file = current / env_name
            if env_file.exists():
                for line in env_file.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and v and k not in os.environ:
                            os.environ[k] = v
        current = current.parent


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
    """Download audio track from YouTube URL using yt-dlp or reuse existing audio file."""
    out_dir.mkdir(parents=True, exist_ok=True)

    # Check if already downloaded
    vid_match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    if vid_match:
        quick_id = vid_match.group(1)
        existing_mp3 = out_dir / f"{quick_id}.mp3"
        if existing_mp3.exists() and existing_mp3.stat().st_size > 1024 * 1024:
            print(f"[yt-dlp] Reusing existing audio file: {existing_mp3} ({existing_mp3.stat().st_size / (1024*1024):.2f} MB)")
            # Get video info quickly without re-downloading
            with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get("title", quick_id)
                duration = int(info.get("duration", 0))
            return existing_mp3, quick_id, title, duration

    ffmpeg_exe = get_ffmpeg_path()
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best",
        "http_chunk_size": 10485760,
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

    print(f"\n[yt-dlp] Downloading audio from {url}...")
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

    print(f"[yt-dlp] Title: {title}")
    print(f"[yt-dlp] Duration: {duration // 60}m {duration % 60}s ({duration}s)")
    print(f"[yt-dlp] Audio file: {audio_path} ({audio_path.stat().st_size / (1024*1024):.2f} MB)")
    return audio_path, video_id, title, duration


SYSTEM_PROMPT = """You are a master transcriptionist and Islamic archival scholar specializing in historical recordings, lectures, and theological discussions.

Your task is to produce a complete, verbatim, highly accurate transcript of the provided audio recording from start to finish.

Strict Instructions:
1. TIMESTAMPS:
   - Insert timestamp markers in the format [MM:SS] (or [HH:MM:SS] for timestamps >= 1 hour) at every natural sentence break or topic transition (roughly every 15-30 seconds).
   - Ensure timestamps accurately reflect the timeline of the recording.
2. VERBATIM FIDELITY:
   - Transcribe every spoken word accurately without omitting, summarizing, or skipping parts.
   - Capture speaker transitions, presentation commentary, and recorded audio clips faithfully.
3. NAMES & THEOLOGICAL TERMS:
   - Accurately spell all names (e.g. Dr. Rashad Khalifa, Edip Yuksel, Ahmed Deedat, etc.).
   - Accurately spell Arabic terms and Surah names (e.g. Surat Al-Muddathir, Bismillah, Basmalah, etc.).
4. QURANIC ARABIC & SCRIPTURE:
   - Whenever Quranic verses or Arabic statements are recited, provide the Arabic script followed by the English translation and scripture reference tag: [Quran X:Y].
5. PUNCTUATION & FORMATTING:
   - Use clean, standard punctuation (periods, commas, quotation marks, question marks, and paragraphs).
6. CLEAN OUTPUT:
   - Return ONLY the transcription text with timestamps. Do not add intro greetings, markdown code block wrappers (no ```), or outro notes.
"""


def parse_timestamps_to_segments(transcript_text: str, total_duration: int = 0) -> list[dict]:
    """Parse timestamped transcript into structured segment objects."""
    lines = [l.strip() for l in transcript_text.splitlines() if l.strip()]
    segments = []
    ts_pattern = re.compile(r"\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]")

    def ts_to_seconds(m: re.Match) -> float:
        parts = [int(p) for p in m.groups() if p is not None]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return parts[0] * 60 + parts[1]

    def format_ts(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        if h > 0:
            return f"[{h:02d}:{m:02d}:{s:02d}]"
        return f"[{m:02d}:{s:02d}]"

    current_start = 0.0
    current_text_parts = []

    for line in lines:
        match = ts_pattern.search(line)
        if match:
            if current_text_parts:
                seg_text = " ".join(current_text_parts).strip()
                if seg_text:
                    segments.append({
                        "start": current_start,
                        "timestamp": format_ts(current_start),
                        "text": seg_text,
                    })
                current_text_parts = []

            current_start = ts_to_seconds(match)
            clean_line = ts_pattern.sub("", line).strip()
            if clean_line:
                current_text_parts.append(clean_line)
        else:
            current_text_parts.append(line)

    if current_text_parts:
        seg_text = " ".join(current_text_parts).strip()
        if seg_text:
            segments.append({
                "start": current_start,
                "timestamp": format_ts(current_start),
                "text": seg_text,
            })

    # Add end times
    for i in range(len(segments)):
        start_sec = segments[i]["start"]
        if i + 1 < len(segments):
            segments[i]["end"] = max(start_sec + 1.0, segments[i + 1]["start"] - 0.1)
        else:
            segments[i]["end"] = max(start_sec + 5.0, float(total_duration) if total_duration else start_sec + 10.0)

    return segments


def segments_to_srt(segments: list[dict]) -> str:
    """Format segments into SRT subtitle format."""
    def format_srt_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    srt_entries = []
    for i, seg in enumerate(segments, 1):
        srt_entries.append(str(i))
        srt_entries.append(f"{format_srt_time(seg['start'])} --> {format_srt_time(seg['end'])}")
        srt_entries.append(seg["text"])
        srt_entries.append("")
    return "\n".join(srt_entries)


def segments_to_vtt(segments: list[dict]) -> str:
    """Format segments into WebVTT subtitle format."""
    def format_vtt_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

    vtt_entries = ["WEBVTT", ""]
    for i, seg in enumerate(segments, 1):
        vtt_entries.append(str(i))
        vtt_entries.append(f"{format_vtt_time(seg['start'])} --> {format_vtt_time(seg['end'])}")
        vtt_entries.append(seg["text"])
        vtt_entries.append("")
    return "\n".join(vtt_entries)


def transcribe_live_stream(
    audio_path: Path,
    video_id: str,
    title: str,
    duration: int,
    out_dir: Path,
    client: genai.Client,
    model_name: str = "gemini-2.5-flash",
) -> Path:
    """Upload audio to Gemini Files API and transcribe with live streaming output in terminal."""
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[gemini] Uploading {audio_path.name} to Gemini Files API...")
    t_upload = time.time()
    audio_file = client.files.upload(file=str(audio_path))
    print(f"[gemini] Uploaded in {time.time() - t_upload:.1f}s as {audio_file.name}")

    # Wait until file state is ACTIVE
    while audio_file.state.name == "PROCESSING":
        print("[gemini] Waiting for audio file processing on Gemini...")
        time.sleep(4)
        audio_file = client.files.get(name=audio_file.name)

    if audio_file.state.name == "FAILED":
        raise RuntimeError(f"Gemini audio processing failed: {audio_file.error}")

    print(f"[gemini] File is ACTIVE. Starting live streaming transcription with {model_name}...")
    print(f"\n{'='*70}")
    print("LIVE TRANSCRIPT OUTPUT:")
    print(f"{'='*70}\n")

    t_start = time.time()
    full_text_chunks = []

    try:
        response_stream = client.models.generate_content_stream(
            model=model_name,
            contents=[
                audio_file,
                "Transcribe this entire video recording from start to finish. Include accurate [MM:SS] timestamps at every paragraph break. Accurately transcribe Quranic Arabic verses in Arabic script with [Quran X:Y] citations."
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,
            ),
        )

        for chunk in response_stream:
            text = chunk.text
            if text:
                try:
                    sys.stdout.write(text)
                    sys.stdout.flush()
                except UnicodeEncodeError:
                    sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
                    sys.stdout.flush()
                full_text_chunks.append(text)

    finally:
        # Cleanup uploaded audio file from cloud storage
        try:
            client.files.delete(name=audio_file.name)
            print(f"\n\n[gemini] Cleaned up remote cloud file: {audio_file.name}")
        except Exception:
            pass

    transcript_text = "".join(full_text_chunks).strip()
    elapsed = time.time() - t_start
    print(f"\n{'='*70}")
    print(f"[gemini] Live transcription finished in {elapsed:.1f}s ({len(transcript_text.split())} words)")
    print(f"{'='*70}\n")

    # Save TXT
    txt_path = out_dir / "transcript.txt"
    txt_path.write_text(transcript_text, encoding="utf-8")

    # Parse and save SRT / VTT / JSON
    segments = parse_timestamps_to_segments(transcript_text, duration)
    srt_text = segments_to_srt(segments)
    srt_path = out_dir / "transcript.srt"
    srt_path.write_text(srt_text, encoding="utf-8")

    vtt_text = segments_to_vtt(segments)
    vtt_path = out_dir / "transcript.vtt"
    vtt_path.write_text(vtt_text, encoding="utf-8")

    json_path = out_dir / "transcript.json"
    json_path.write_text(json.dumps(segments, indent=2, ensure_ascii=False), encoding="utf-8")

    # Metadata
    meta_path = out_dir / "metadata.json"
    metadata = {
        "video_id": video_id,
        "title": title,
        "duration_seconds": duration,
        "word_count": len(transcript_text.split()),
        "segments_count": len(segments),
        "model": model_name,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"[output] Transcript (TXT):    {txt_path.resolve()}")
    print(f"[output] Subtitles (SRT):     {srt_path.resolve()}")
    print(f"[output] Web Subtitles (VTT): {vtt_path.resolve()}")
    print(f"[output] Segments (JSON):     {json_path.resolve()}")
    print(f"[output] Metadata (JSON):     {meta_path.resolve()}")

    return out_dir


def main():
    load_env_local()
    parser = argparse.ArgumentParser(description="Live YouTube Transcription using Gemini 2.5 Flash")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument("--model", default="gemini-2.5-flash", help="Gemini model name")
    parser.add_argument("--out", default="./transcripts", help="Output directory")
    parser.add_argument("--key", default=None, help="Gemini API Key")

    args = parser.parse_args()
    api_key = args.key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY not found in environment or .env.local.", file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    out_base = Path(args.out)
    audio_tmp_dir = out_base / "_audio"

    audio_path, video_id, title, duration = download_audio(args.url, audio_tmp_dir)
    target_out_dir = out_base / video_id

    transcribe_live_stream(
        audio_path=audio_path,
        video_id=video_id,
        title=title,
        duration=duration,
        out_dir=target_out_dir,
        client=client,
        model_name=args.model,
    )


if __name__ == "__main__":
    main()
