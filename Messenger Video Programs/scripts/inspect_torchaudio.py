import torchaudio
print(f"Torchaudio version: {torchaudio.__version__}")
try:
    print(f"AudioMetaData: {torchaudio.AudioMetaData}")
except AttributeError:
    print("AudioMetaData not found in torchaudio")
    print(f"Dir: {dir(torchaudio)}")
