from models import Vocabulary
from sqlalchemy.orm import Session

def seed_vocabulary(db: Session):
    # Check if we already have a good amount of vocab
    if db.query(Vocabulary).count() > 10:
        return

    thematic_vocab = [
        # Education Theme
        {"word": "Academic", "phonetic": "/ˌæk.əˈdem.ɪk/", "meaning": "Học thuật", "example": "IELTS is an academic English test.", "is_global": True},
        {"word": "Curriculum", "phonetic": "/kəˈrɪk.jə.ləm/", "meaning": "Chương trình giảng dạy", "example": "The school curriculum is being updated.", "is_global": True},
        {"word": "Pedagogy", "phonetic": "/ˈped.ə.ɡɒdʒ.i/", "meaning": "Sư phạm", "example": "Modern pedagogy focuses on student engagement.", "is_global": True},
        
        # Technology Theme
        {"word": "Innovation", "phonetic": "/ˌɪn.əˈveɪ.ʃən/", "meaning": "Sự đổi mới", "example": "Technological innovation drives the economy.", "is_global": True},
        {"word": "Automation", "phonetic": "/ˌɔː.təˈmeɪ.ʃən/", "meaning": "Tự động hóa", "example": "Automation is replacing many manual jobs.", "is_global": True},
        {"word": "Artificial", "phonetic": "/ˌɑː.tɪˈfɪʃ.əl/", "meaning": "Nhân tạo", "example": "Artificial intelligence is a hot topic.", "is_global": True},
        
        # Environment Theme
        {"word": "Sustainable", "phonetic": "/səˈsteɪ.nə.bəl/", "meaning": "Bền vững", "example": "We need sustainable energy sources.", "is_global": True},
        {"word": "Biodiversity", "phonetic": "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/", "meaning": "Đa dạng sinh học", "example": "The rainforest has high biodiversity.", "is_global": True},
        {"word": "Ecosystem", "phonetic": "/ˈiː.kəʊˌsɪs.təm/", "meaning": "Hệ sinh thái", "example": "Pollution can destroy the local ecosystem.", "is_global": True},
        
        # Health Theme
        {"word": "Well-being", "phonetic": "/ˌwelˈbiː.ɪŋ/", "meaning": "Sự khỏe mạnh", "example": "Exercise is vital for your well-being.", "is_global": True},
        {"word": "Therapeutic", "phonetic": "/ˌθer.əˈpjuː.tɪk/", "meaning": "Có tính trị liệu", "example": "Music has therapeutic benefits.", "is_global": True},
        {"word": "Nutritious", "phonetic": "/njuːˈtrɪʃ.əs/", "meaning": "Bổ dưỡng", "example": "Always try to eat a nutritious breakfast.", "is_global": True}
    ]

    for item in thematic_vocab:
        existing = db.query(Vocabulary).filter(Vocabulary.word == item["word"]).first()
        if not existing:
            db_vocab = Vocabulary(**item)
            db.add(db_vocab)
    
    db.commit()
