try:
    # pyrefly: ignore [missing-import]
    import edge_tts
except ImportError:
    edge_tts = None
import os
import uuid
import json
import asyncio
import subprocess

class TTSService:
    def __init__(self, static_dir: str = "static"):
        self.static_dir = static_dir
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
            
        # A pool of distinct voices (male/female from different regions) to assign to different characters
        self.voice_pool = [
            "en-US-JennyNeural",    # Female US
            "en-US-GuyNeural",      # Male US
            "en-GB-SoniaNeural",    # Female UK
            "en-GB-RyanNeural",     # Male UK
            "en-AU-NatashaNeural",  # Female AU
            "en-AU-WilliamNeural",  # Male AU
            "en-CA-ClaraNeural",    # Female CA
            "en-CA-LiamNeural",     # Male CA
        ]

    def _download_google_tts(self, text: str, filepath: str) -> bool:
        try:
            import urllib.request
            import urllib.parse
            clean_text = text.strip()[:200]
            url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q={urllib.parse.quote(clean_text)}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                content = response.read()
                if content and len(content) > 200:
                    with open(filepath, "wb") as f:
                        f.write(content)
                    return True
        except Exception as err:
            print(f"Google TTS fallback error: {err}")
        return False

    async def generate_speech(self, text: str, default_voice: str = "en-US-JennyNeural"):
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(self.static_dir, filename)
        
        # Try to parse as JSON for multi-voice conversation
        parsed_json = None
        try:
            parsed_json = json.loads(text)
        except json.JSONDecodeError:
            pass

        if isinstance(parsed_json, list) and len(parsed_json) > 0 and isinstance(parsed_json[0], dict):
            # It's a conversation! Map each speaker to a voice
            speaker_voices = {}
            temp_files = []
            voice_index = 0
            
            try:
                for idx, item in enumerate(parsed_json):
                    if not item:
                        continue
                    # Assume each dict has one key-value pair like {"a": "Hello"}
                    speaker = list(item.keys())[0]
                    speech_text = str(item[speaker])
                    
                    if speaker not in speaker_voices:
                        speaker_voices[speaker] = self.voice_pool[voice_index % len(self.voice_pool)]
                        voice_index += 1
                        
                    voice = speaker_voices[speaker]
                    temp_file = os.path.join(self.static_dir, f"temp_{uuid.uuid4()}.mp3")
                    temp_files.append(temp_file)
                    
                    if edge_tts:
                        try:
                            communicate = edge_tts.Communicate(speech_text, voice)
                            await communicate.save(temp_file)
                        except Exception:
                            self._download_google_tts(speech_text, temp_file)
                    else:
                        self._download_google_tts(speech_text, temp_file)
                
                # Combine audio files using ffmpeg
                if temp_files:
                    list_file_path = os.path.join(self.static_dir, f"list_{uuid.uuid4()}.txt")
                    with open(list_file_path, "w") as f:
                        for temp_file in temp_files:
                            f.write(f"file '{os.path.basename(temp_file)}'\n")
                    
                    # Run ffmpeg to concatenate
                    subprocess.run(
                        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", os.path.basename(list_file_path), "-c", "copy", filename],
                        cwd=self.static_dir,
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    
                    # Cleanup temp files
                    os.remove(list_file_path)
                    for temp_file in temp_files:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                            
            except Exception as e:
                print(f"Multi-voice TTS failed: {e}. Falling back to single voice.")
                # Fallback if something goes wrong
                saved = False
                if edge_tts:
                    try:
                        communicate = edge_tts.Communicate(text, default_voice)
                        await communicate.save(filepath)
                        saved = True
                    except Exception as err:
                        print(f"Edge-tts fallback failed: {err}")
                if not saved:
                    self._download_google_tts(text, filepath)
        else:
            # Standard single voice
            saved = False
            if edge_tts:
                try:
                    communicate = edge_tts.Communicate(text, default_voice)
                    await communicate.save(filepath)
                    saved = True
                except Exception as err:
                    print(f"Edge-TTS failed ({err}), falling back to Google TTS.")
            if not saved:
                self._download_google_tts(text, filepath)
        
        return filename

# Create a singleton instance
tts_service = TTSService()
