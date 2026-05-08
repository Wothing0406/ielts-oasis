import edge_tts
import os
import uuid

class TTSService:
    def __init__(self, static_dir: str = "static"):
        self.static_dir = static_dir
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)

    async def generate_speech(self, text: str, voice: str = "en-US-EmmaMultilingualNeural"):
        # Create a unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(self.static_dir, filename)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
        
        return filename

# Create a singleton instance
tts_service = TTSService()
