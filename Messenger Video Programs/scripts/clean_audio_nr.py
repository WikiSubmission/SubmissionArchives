import soundfile as sf
import noisereduce as nr
import librosa
import numpy as np

# Load audio file
file_path = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\Messenger Audio ｜ 5.2.mp3"
print(f"Loading {file_path}...")
data, rate = librosa.load(file_path, sr=None)

# Perform noise reduction
print("Performing noise reduction...")
# Assume the first 0.5 seconds is noise (common in tapes) or just use the general statistics
reduced_noise = nr.reduce_noise(y=data, sr=rate, stationary=True)

# Save output
output_path = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\Messenger Audio ｜ 5.2_noisereduce.wav"
print(f"Saving to {output_path}...")
sf.write(output_path, reduced_noise, rate)
print("Done.")
