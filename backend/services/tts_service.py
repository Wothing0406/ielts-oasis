import edge_tts
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
                    
                    communicate = edge_tts.Communicate(speech_text, voice)
                    await communicate.save(temp_file)
                
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
                communicate = edge_tts.Communicate(text, default_voice)
                await communicate.save(filepath)
        else:
            # Standard single voice
            communicate = edge_tts.Communicate(text, default_voice)
            await communicate.save(filepath)
        
        return filename

# Create a singleton instance
tts_service = TTSService()
