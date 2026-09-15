"""
Seed script: Tự động nạp 120+ từ vựng IELTS chuẩn từ danh sách AWL và Oxford 5000 CEFR
vào bảng meowcha_vocab và tạo sẵn dữ liệu khởi đầu cho Bảng Phong Thần và Save Slots.
"""
import os
import json
import logging
from database import engine, SessionLocal, Base
from models import MeowchaVocab, MeowchaSave, MeowchaLeaderboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_meowcha")

# Danh sách từ vựng IELTS nòng cốt theo 4 cấp độ ma thạch & Band IELTS
CURATED_VOCAB_LIST = [
    # =========================================================================
    # BAND 0: IELTS 4.0 - 5.0 (3-5 Ký tự • FROST: Huyền Băng Cực Phách)
    # =========================================================================
    {"word": "ALERT", "default_ipa": "/əˈlɜːt/", "type": "adj", "meaning": "Cảnh giác, tỉnh táo, lanh lẹ", "band": 0, "asteroid": "FROST"},
    {"word": "SWIFT", "default_ipa": "/swɪft/", "type": "adj", "meaning": "Mau lẹ, nhanh như chớp", "band": 0, "asteroid": "FROST"},
    {"word": "FOCUS", "default_ipa": "/ˈfəʊkəs/", "type": "verb", "meaning": "Tập trung tinh thần, định tâm", "band": 0, "asteroid": "FROST"},
    {"word": "CLIMB", "default_ipa": "/klaɪm/", "type": "verb", "meaning": "Leo trèo, thăng tiến tu vi", "band": 0, "asteroid": "FROST"},
    {"word": "BRAVE", "default_ipa": "/breɪv/", "type": "adj", "meaning": "Dũng cảm, kiên định can trường", "band": 0, "asteroid": "FROST"},
    {"word": "VIGOR", "default_ipa": "/ˈvɪɡər/", "type": "noun", "meaning": "Nguyên khí, sinh lực dồi dào", "band": 0, "asteroid": "FROST"},
    {"word": "CLEAR", "default_ipa": "/klɪər/", "type": "adj", "meaning": "Trong sáng, minh triết, rõ ràng", "band": 0, "asteroid": "FROST"},
    {"word": "LUCID", "default_ipa": "/ˈluːsɪd/", "type": "adj", "meaning": "Minh bạch, rõ ràng, sáng suốt", "band": 0, "asteroid": "FROST"},
    {"word": "QUICK", "default_ipa": "/kwɪk/", "type": "adj", "meaning": "Nhanh chóng, mau lẹ", "band": 0, "asteroid": "FROST"},
    {"word": "SMART", "default_ipa": "/smɑːt/", "type": "adj", "meaning": "Thông minh, khôn khéo", "band": 0, "asteroid": "FROST"},
    {"word": "SHARP", "default_ipa": "/ʃɑːp/", "type": "adj", "meaning": "Sắc bén, nhạy bén", "band": 0, "asteroid": "FROST"},
    {"word": "FORCE", "default_ipa": "/fɔːs/", "type": "noun", "meaning": "Lực lượng, uy lực kiếm khí", "band": 0, "asteroid": "FROST"},
    {"word": "SKILL", "default_ipa": "/skɪl/", "type": "noun", "meaning": "Kỹ năng, chiêu thức võ học", "band": 0, "asteroid": "FROST"},
    {"word": "TRAIN", "default_ipa": "/treɪn/", "type": "verb", "meaning": "Rèn luyện, tu tập ngày đêm", "band": 0, "asteroid": "FROST"},
    {"word": "CRAFT", "default_ipa": "/krɑːft/", "type": "noun", "meaning": "Nghề thủ công, thuật luyện đan", "band": 0, "asteroid": "FROST"},
    {"word": "VITAL", "default_ipa": "/ˈvaɪtl/", "type": "adj", "meaning": "Trọng yếu, cốt tử, sống còn", "band": 0, "asteroid": "FROST"},
    {"word": "NOBLE", "default_ipa": "/ˈnəʊbl/", "type": "adj", "meaning": "Cao quý, khí chất thanh cao", "band": 0, "asteroid": "FROST"},
    {"word": "GLORY", "default_ipa": "/ˈɡlɔːri/", "type": "noun", "meaning": "Vinh quang, hào quang rực rỡ", "band": 0, "asteroid": "FROST"},
    {"word": "FLAME", "default_ipa": "/fleɪm/", "type": "noun", "meaning": "Ngọn lửa, đan hỏa bùng cháy", "band": 0, "asteroid": "FROST"},
    {"word": "GUARD", "default_ipa": "/ɡɑːd/", "type": "verb", "meaning": "Bảo vệ, phòng thủ đan điền", "band": 0, "asteroid": "FROST"},
    {"word": "SWORD", "default_ipa": "/sɔːd/", "type": "noun", "meaning": "Bảo kiếm, tiên kiếm linh đài", "band": 0, "asteroid": "FROST"},
    {"word": "REALM", "default_ipa": "/relm/", "type": "noun", "meaning": "Cảnh giới, tiên giới cõi trần", "band": 0, "asteroid": "FROST"},
    {"word": "QUEST", "default_ipa": "/kwest/", "type": "noun", "meaning": "Hành trình tìm kiếm chân lý", "band": 0, "asteroid": "FROST"},
    {"word": "PEACE", "default_ipa": "/piːs/", "type": "noun", "meaning": "Thanh tịnh, an lạc trong tâm", "band": 0, "asteroid": "FROST"},
    {"word": "LIGHT", "default_ipa": "/laɪt/", "type": "noun", "meaning": "Ánh sáng, đạo quang dẫn lối", "band": 0, "asteroid": "FROST"},
    {"word": "SOLID", "default_ipa": "/ˈsɒlɪd/", "type": "adj", "meaning": "Vững chắc như bàn thạch", "band": 0, "asteroid": "FROST"},
    {"word": "CLEAN", "default_ipa": "/kliːn/", "type": "adj", "meaning": "Thanh sạch, không chút tạp niệm", "band": 0, "asteroid": "FROST"},
    {"word": "GRAND", "default_ipa": "/ɡrænd/", "type": "adj", "meaning": "Hùng vĩ, tráng lệ, phi thường", "band": 0, "asteroid": "FROST"},
    {"word": "POWER", "default_ipa": "/ˈpaʊər/", "type": "noun", "meaning": "Uy lực, chân nguyên cuồn cuộn", "band": 0, "asteroid": "FROST"},
    {"word": "BRAIN", "default_ipa": "/breɪn/", "type": "noun", "meaning": "Trí tuệ, thần thức khai mở", "band": 0, "asteroid": "FROST"},

    # =========================================================================
    # BAND 1: IELTS 6.0 - 6.5 (6-7 Ký tự • INFERNO: Cửu U Hỏa Diễm)
    # =========================================================================
    {"word": "NURTURE", "default_ipa": "/ˈnɜːtʃər/", "type": "verb", "meaning": "Bồi dưỡng, nuôi nấng đạo hạnh", "band": 1, "asteroid": "INFERNO"},
    {"word": "ASPIRE", "default_ipa": "/əˈspaɪər/", "type": "verb", "meaning": "Khao khát, hướng tới cảnh giới cao", "band": 1, "asteroid": "INFERNO"},
    {"word": "THRIVE", "default_ipa": "/θraɪv/", "type": "verb", "meaning": "Phát triển mạnh mẽ, hưng thịnh", "band": 1, "asteroid": "INFERNO"},
    {"word": "ENDURE", "default_ipa": "/ɪnˈdjʊər/", "type": "verb", "meaning": "Chịu đựng, nhẫn nại vượt khổ ải", "band": 1, "asteroid": "INFERNO"},
    {"word": "EXPAND", "default_ipa": "/ɪkˈspænd/", "type": "verb", "meaning": "Khai mở, mở rộng đan điền", "band": 1, "asteroid": "INFERNO"},
    {"word": "ZEALOUS", "default_ipa": "/ˈzeləs/", "type": "adj", "meaning": "Hăng hái, nhiệt huyết, tận tụy", "band": 1, "asteroid": "INFERNO"},
    {"word": "ASCEND", "default_ipa": "/əˈsend/", "type": "verb", "meaning": "Thăng hoa, phi thăng, độ kiếp", "band": 1, "asteroid": "INFERNO"},
    {"word": "INSPIRE", "default_ipa": "/ɪnˈspaɪər/", "type": "verb", "meaning": "Truyền cảm hứng, thắp sáng kiếm ý", "band": 1, "asteroid": "INFERNO"},
    {"word": "HARMONY", "default_ipa": "/ˈhɑːməni/", "type": "noun", "meaning": "Sự hài hòa, âm dương cân bằng", "band": 1, "asteroid": "INFERNO"},
    {"word": "VICTORY", "default_ipa": "/ˈvɪktəri/", "type": "noun", "meaning": "Chiến thắng, trảm ma thành công", "band": 1, "asteroid": "INFERNO"},
    {"word": "BALANCE", "default_ipa": "/ˈbæləns/", "type": "noun", "meaning": "Cân bằng, giữ vững đạo tâm", "band": 1, "asteroid": "INFERNO"},
    {"word": "RESCUE", "default_ipa": "/ˈreskjuː/", "type": "verb", "meaning": "Cứu nguy, giải thoát đan điền", "band": 1, "asteroid": "INFERNO"},
    {"word": "ACHIEVE", "default_ipa": "/əˈtʃiːv/", "type": "verb", "meaning": "Đạt được thành tựu tu vi", "band": 1, "asteroid": "INFERNO"},
    {"word": "REFLECT", "default_ipa": "/rɪˈflekt/", "type": "verb", "meaning": "Soi chiếu, phản tỉnh bản thân", "band": 1, "asteroid": "INFERNO"},
    {"word": "RADIANT", "default_ipa": "/ˈreɪdiənt/", "type": "adj", "meaning": "Tỏa sáng rực rỡ, hào quang", "band": 1, "asteroid": "INFERNO"},
    {"word": "DYNAMIC", "default_ipa": "/daɪˈnæmɪk/", "type": "adj", "meaning": "Năng động, biến hóa khôn lường", "band": 1, "asteroid": "INFERNO"},
    {"word": "ENHANCE", "default_ipa": "/ɪnˈhɑːns/", "type": "verb", "meaning": "Nâng cao, gia tăng công lực", "band": 1, "asteroid": "INFERNO"},
    {"word": "PERSIST", "default_ipa": "/pəˈsɪst/", "type": "verb", "meaning": "Kiên trì bám đuổi đến cùng", "band": 1, "asteroid": "INFERNO"},
    {"word": "CONQUER", "default_ipa": "/ˈkɒŋkər/", "type": "verb", "meaning": "Chinh phục, trấn áp yêu ma", "band": 1, "asteroid": "INFERNO"},
    {"word": "ACQUIRE", "default_ipa": "/əˈkwaɪər/", "type": "verb", "meaning": "Thu nhận, lĩnh hội bí tịch", "band": 1, "asteroid": "INFERNO"},
    {"word": "ADVANCE", "default_ipa": "/ədˈvɑːns/", "type": "verb", "meaning": "Tiến bộ, đột phá tầng cao", "band": 1, "asteroid": "INFERNO"},
    {"word": "RESOLVE", "default_ipa": "/rɪˈzɒlv/", "type": "verb", "meaning": "Quyết tâm, giải quyết trở ngại", "band": 1, "asteroid": "INFERNO"},
    {"word": "BENEFIT", "default_ipa": "/ˈbenɪfɪt/", "type": "noun", "meaning": "Lợi ích, đạo quả gặt hái", "band": 1, "asteroid": "INFERNO"},
    {"word": "TRIUMPH", "default_ipa": "/ˈtraɪʌmf/", "type": "noun", "meaning": "Thắng lợi vang dội, đại thành", "band": 1, "asteroid": "INFERNO"},
    {"word": "PURIFY", "default_ipa": "/ˈpjʊərɪfaɪ/", "type": "verb", "meaning": "Thanh lọc tạp chất, luyện tủy", "band": 1, "asteroid": "INFERNO"},
    {"word": "BRAVERY", "default_ipa": "/ˈbreɪvəri/", "type": "noun", "meaning": "Lòng dũng cảm vô song", "band": 1, "asteroid": "INFERNO"},
    {"word": "CLARITY", "default_ipa": "/ˈklærəti/", "type": "noun", "meaning": "Sự thông suốt, tỏ tường đạo lý", "band": 1, "asteroid": "INFERNO"},
    {"word": "FORTUNE", "default_ipa": "/ˈfɔːtʃuːn/", "type": "noun", "meaning": "Cơ duyên, vận may tiên đạo", "band": 1, "asteroid": "INFERNO"},
    {"word": "JOURNEY", "default_ipa": "/ˈdʒɜːni/", "type": "noun", "meaning": "Hành trình tu chân ngàn dặm", "band": 1, "asteroid": "INFERNO"},
    {"word": "MASTERY", "default_ipa": "/ˈmɑːstəri/", "type": "noun", "meaning": "Sự tinh thông, xuất quỷ nhập thần", "band": 1, "asteroid": "INFERNO"},

    # =========================================================================
    # BAND 2: IELTS 7.0 - 7.5 (8-9 Ký tự • VOID: Hắc Diệu Hư Không)
    # =========================================================================
    {"word": "RESILIENT", "default_ipa": "/rɪˈzɪliənt/", "type": "adj", "meaning": "Kiên cường, bền bỉ, hồi phục nhanh", "band": 2, "asteroid": "VOID"},
    {"word": "PERSEVERE", "default_ipa": "/ˌpɜːsɪˈvɪər/", "type": "verb", "meaning": "Kiên trì, bền chí theo đuổi", "band": 2, "asteroid": "VOID"},
    {"word": "DILIGENT", "default_ipa": "/ˈdɪlɪdʒənt/", "type": "adj", "meaning": "Cần cù, siêng năng, chuyên tâm", "band": 2, "asteroid": "VOID"},
    {"word": "ELOQUENT", "default_ipa": "/ˈeləkwənt/", "type": "adj", "meaning": "Hùng biện, lưu loát, truyền cảm", "band": 2, "asteroid": "VOID"},
    {"word": "PROFOUND", "default_ipa": "/prəˈfaʊnd/", "type": "adj", "meaning": "Sâu sắc, uyên thâm, thâm thúy", "band": 2, "asteroid": "VOID"},
    {"word": "TRANQUIL", "default_ipa": "/ˈtræŋkwɪl/", "type": "adj", "meaning": "Thanh tịnh, an tĩnh, bình yên", "band": 2, "asteroid": "VOID"},
    {"word": "COGNITIVE", "default_ipa": "/ˈkɒɡnətɪv/", "type": "adj", "meaning": "Thuộc về nhận thức, tư duy", "band": 2, "asteroid": "VOID"},
    {"word": "TENACIOUS", "default_ipa": "/təˈneɪʃəs/", "type": "adj", "meaning": "Kiên quyết, kiên trì, gan lì", "band": 2, "asteroid": "VOID"},
    {"word": "VERSATILE", "default_ipa": "/ˈvɜːsətaɪl/", "type": "adj", "meaning": "Đa năng, linh hoạt, toàn diện", "band": 2, "asteroid": "VOID"},
    {"word": "VINDICATE", "default_ipa": "/ˈvɪndɪkeɪt/", "type": "verb", "meaning": "Minh oan, chứng thực tính đúng", "band": 2, "asteroid": "VOID"},
    {"word": "PRAGMATIC", "default_ipa": "/præɡˈmætɪk/", "type": "adj", "meaning": "Thực tế, trọng hiệu quả", "band": 2, "asteroid": "VOID"},
    {"word": "AUTHENTIC", "default_ipa": "/ɔːˈθentɪk/", "type": "adj", "meaning": "Đích thực, chân thật, nguyên bản", "band": 2, "asteroid": "VOID"},
    {"word": "CULTIVATE", "default_ipa": "/ˈkʌltɪveɪt/", "type": "verb", "meaning": "Tu dưỡng, trau dồi, bồi đắp", "band": 2, "asteroid": "VOID"},
    {"word": "STRATEGIC", "default_ipa": "/strəˈtiːdʒɪk/", "type": "adj", "meaning": "Có tính chiến lược, bài bản", "band": 2, "asteroid": "VOID"},
    {"word": "ELEVATION", "default_ipa": "/ˌelɪˈveɪʃn/", "type": "noun", "meaning": "Sự nâng tầm, thăng hoa cảnh giới", "band": 2, "asteroid": "VOID"},
    {"word": "ENDURANCE", "default_ipa": "/ɪnˈdjʊərəns/", "type": "noun", "meaning": "Sức chịu đựng dẻo dai phi thường", "band": 2, "asteroid": "VOID"},
    {"word": "RESISTANCE", "default_ipa": "/rɪˈzɪstəns/", "type": "noun", "meaning": "Sức kháng cự, hộ thể ma thuẫn", "band": 2, "asteroid": "VOID"},
    {"word": "SPIRITUAL", "default_ipa": "/ˈspɪrɪtʃuəl/", "type": "adj", "meaning": "Thuộc tâm linh, thần thức tiên gia", "band": 2, "asteroid": "VOID"},
    {"word": "ASCENSION", "default_ipa": "/əˈsenʃn/", "type": "noun", "meaning": "Sự thăng thiên, phi thăng tiên giới", "band": 2, "asteroid": "VOID"},
    {"word": "TRANSCEND", "default_ipa": "/trænˈsend/", "type": "verb", "meaning": "Vượt lên trên, siêu việt phàm trần", "band": 2, "asteroid": "VOID"},
    {"word": "DISCIPLINE", "default_ipa": "/ˈdɪsəplɪn/", "type": "noun", "meaning": "Kỷ luật thép, phép tắc tông môn", "band": 2, "asteroid": "VOID"},
    {"word": "PERCEPTION", "default_ipa": "/pəˈsepʃn/", "type": "noun", "meaning": "Sự cảm thụ, trực giác tâm linh", "band": 2, "asteroid": "VOID"},
    {"word": "POTENTIAL", "default_ipa": "/pəˈtenʃl/", "type": "noun", "meaning": "Tiềm năng vô tận trong đan điền", "band": 2, "asteroid": "VOID"},
    {"word": "SOVEREIGN", "default_ipa": "/ˈsɒvrɪn/", "type": "adj", "meaning": "Tối cao, tôn chủ thống lĩnh", "band": 2, "asteroid": "VOID"},
    {"word": "EXCELLENCE", "default_ipa": "/ˈeksələns/", "type": "noun", "meaning": "Sự xuất sắc tột bực, hoàn mỹ", "band": 2, "asteroid": "VOID"},
    {"word": "DOMINANCE", "default_ipa": "/ˈdɒmɪnəns/", "type": "noun", "meaning": "Thế áp đảo, kiếm ý trấn áp", "band": 2, "asteroid": "VOID"},
    {"word": "FLOURISH", "default_ipa": "/ˈflʌrɪʃ/", "type": "verb", "meaning": "Hưng thịnh, đơm hoa kết quả", "band": 2, "asteroid": "VOID"},
    {"word": "LUMINOSITY", "default_ipa": "/ˌluːmɪˈnɒsəti/", "type": "noun", "meaning": "Độ sáng lạn, quang hoa tỏa rạng", "band": 2, "asteroid": "VOID"},
    {"word": "FORTITUDE", "default_ipa": "/ˈfɔːtɪtjuːd/", "type": "noun", "meaning": "Sự kiên định, dũng khí sắt đá", "band": 2, "asteroid": "VOID"},
    {"word": "EQUILIBRIUM", "default_ipa": "/ˌekwɪˈlɪbriəm/", "type": "noun", "meaning": "Trạng thái cân bằng tuyệt đối", "band": 2, "asteroid": "VOID"},

    # =========================================================================
    # BAND 3: IELTS 8.0+ (10+ Ký tự • BLOOD_THUNDER: Vạn Kiếp Huyết Lôi)
    # =========================================================================
    {"word": "AMELIORATE", "default_ipa": "/əˈmiːliəreɪt/", "type": "verb", "meaning": "Cải thiện, làm cho tốt đẹp hơn", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "SUBSTANTIAL", "default_ipa": "/səbˈstænʃl/", "type": "adj", "meaning": "Đáng kể, trọng yếu, lớn lao", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "UBIQUITOUS", "default_ipa": "/juːˈbɪkwɪtəs/", "type": "adj", "meaning": "Phổ biến, ở đâu cũng có mặt", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "COMPREHEND", "default_ipa": "/ˌkɒmprɪˈhend/", "type": "verb", "meaning": "Thấu hiểu trọn vẹn, lĩnh hội", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "METICULOUS", "default_ipa": "/məˈtɪkjələs/", "type": "adj", "meaning": "Tỉ mỉ, cẩn trọng, kỹ lưỡng", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "SERENDIPITY", "default_ipa": "/ˌserənˈdɪpəti/", "type": "noun", "meaning": "Cơ duyên may mắn bất ngờ", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "INNOVATIVE", "default_ipa": "/ˈɪnəveɪtɪv/", "type": "adj", "meaning": "Sáng tạo, đổi mới, tiên phong", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "INEVITABLE", "default_ipa": "/ɪnˈevɪtəbl/", "type": "adj", "meaning": "Tất yếu, không thể tránh khỏi", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "BENEVOLENT", "default_ipa": "/bəˈnevələnt/", "type": "adj", "meaning": "Nhân từ, bác ái, rộng lượng", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "ENLIGHTEN", "default_ipa": "/ɪnˈlaɪtn/", "type": "verb", "meaning": "Khai sáng, giác ngộ đạo lý", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "TRANSCENDENT", "default_ipa": "/trænˈsendənt/", "type": "adj", "meaning": "Siêu việt, vượt khỏi tầm thường", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "EXTRAORDINARY", "default_ipa": "/ɪkˈstrɔːdnri/", "type": "adj", "meaning": "Phi thường, xuất chúng, dị biệt", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "REVOLUTIONARY", "default_ipa": "/ˌrevəˈluːʃənri/", "type": "adj", "meaning": "Cách mạng, đột phá ngoạn mục", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "DISTINGUISHED", "default_ipa": "/dɪˈstɪŋɡwɪʃt/", "type": "adj", "meaning": "Ưu tú, xuất chúng, lừng danh", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "COMPREHENSIVE", "default_ipa": "/ˌkɒmprɪˈhensɪv/", "type": "adj", "meaning": "Toàn diện, bao quát mọi mặt", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "UNCONQUERABLE", "default_ipa": "/ʌnˈkɒŋkərəbl/", "type": "adj", "meaning": "Bất khả chiến bại, không thể khuất phục", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "INDOMITABLE", "default_ipa": "/ɪnˈdɒmɪtəbl/", "type": "adj", "meaning": "Bất khuất, kiên cường bất biến", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "PHILOSOPHICAL", "default_ipa": "/ˌfɪləˈsɒfɪkl/", "type": "adj", "meaning": "Thuộc triết học, đạo lý thâm sâu", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "PHENOMENAL", "default_ipa": "/fəˈnɒmɪnl/", "type": "adj", "meaning": "Kỳ diệu, phi thường hiếm có", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "PERSEVERANCE", "default_ipa": "/ˌpɜːsɪˈvɪərəns/", "type": "noun", "meaning": "Sự kiên trì bền bỉ vượt mọi chông gai", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "TRANSFORMATION", "default_ipa": "/ˌtrænsfəˈmeɪʃn/", "type": "noun", "meaning": "Sự biến hóa, lột xác độ kiếp", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "AUTHENTICITY", "default_ipa": "/ˌɔːθenˈtɪsəti/", "type": "noun", "meaning": "Tính chân thực, bản sắc nguyên vẹn", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "INEXHAUSTIBLE", "default_ipa": "/ˌɪnɪɡˈzɔːstəbl/", "type": "adj", "meaning": "Vô tận, không bao giờ cạn kiệt", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "MULTIDIMENSIONAL", "default_ipa": "/ˌmʌltidaɪˈmenʃənl/", "type": "adj", "meaning": "Đa chiều, đa tầng không gian", "band": 3, "asteroid": "BLOOD_THUNDER"},
    {"word": "ILLUMINATING", "default_ipa": "/ɪˈluːmɪneɪtɪŋ/", "type": "adj", "meaning": "Khai sáng, soi rọi thần thức", "band": 3, "asteroid": "BLOOD_THUNDER"}
]


def load_oxford_dictionary():
    """Tải từ điển Oxford 5000 CEFR nếu có để bổ sung thêm nghĩa và phiên âm chuẩn"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    oxford_path = os.path.join(current_dir, "services", "oxford_5000_cefr.json")
    if os.path.exists(oxford_path):
        try:
            with open(oxford_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                dict_map = {}
                for item in data:
                    w = item.get("word", "").strip().upper()
                    if w and w not in dict_map:
                        dict_map[w] = item
                logger.info(f"Loaded {len(dict_map)} words from Oxford 5000 CEFR dataset.")
                return dict_map
        except Exception as e:
            logger.warning(f"Could not load Oxford dataset: {e}")
    return {}


def seed_meowcha_database():
    """Tạo bảng và seed dữ liệu từ vựng IELTS + Save Slot + Leaderboard vào SQL"""
    logger.info("Khởi tạo cấu trúc bảng Meow-Cha trong SQL Database...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        oxford_map = load_oxford_dictionary()
        
        # 1. NẠP TỪ VỰNG MEOWCHA_VOCAB
        logger.info("Đang nạp kho từ vựng IELTS phân tầng...")
        inserted_count = 0
        updated_count = 0

        for item in CURATED_VOCAB_LIST:
            word_clean = item["word"].strip().upper()
            ipa = item["default_ipa"]
            meaning = item["meaning"]
            pos = item["type"]

            # Bổ sung từ điển Oxford nếu có dữ liệu chi tiết hơn
            if word_clean in oxford_map:
                ox = oxford_map[word_clean]
                if ox.get("phonetic"):
                    ipa = ox["phonetic"]
                if ox.get("type"):
                    pos = ox["type"]

            existing = db.query(MeowchaVocab).filter(MeowchaVocab.word == word_clean).first()
            if existing:
                existing.ipa = ipa
                existing.part_of_speech = pos
                existing.meaning = meaning
                existing.band_level = item["band"]
                existing.asteroid_type = item["asteroid"]
                updated_count += 1
            else:
                vocab = MeowchaVocab(
                    word=word_clean,
                    ipa=ipa,
                    part_of_speech=pos,
                    meaning=meaning,
                    band_level=item["band"],
                    asteroid_type=item["asteroid"],
                    difficulty_score=item["band"] + 1,
                    is_active=True
                )
                db.add(vocab)
                inserted_count += 1

        db.commit()
        logger.info(f"Hoàn tất nạp MeowchaVocab: {inserted_count} từ mới, {updated_count} từ cập nhật.")

        # 2. BẢNG PHONG THẦN (LEADERBOARD) - Để trống cho người chơi thực thụ ghi danh
        logger.info("Bảng Phong Thần sẵn sàng đón nhận chiến tích của các Đạo Hữu!")

        # 3. KHỞI TẠO 3 SAVE SLOTS MẪU CHO GUEST HOẶC SYSTEM NẾU CHƯA CÓ
        save_count = db.query(MeowchaSave).count()
        if save_count == 0:
            logger.info("Khởi tạo 3 Save Slots mặc định trong SQL Database...")
            slot1 = MeowchaSave(
                slot_id=1,
                slot_name="FILE 1 - Chính",
                is_occupied=True,
                realm="Luyện Khí Kỳ",
                realm_idx=0,
                title="Kiếm Đồng",
                hp=50,
                max_hp=50,
                score=0,
                words_slain=0,
                band_idx=0,
                talents={"hpBonus": 0, "slowFactor": 1.0, "critChance": 0.0, "scoreBonusMultiplier": 1, "shieldCharges": 0, "comboAutoKill": False}
            )
            slot2 = MeowchaSave(
                slot_id=2,
                slot_name="FILE 2 - Dự Phòng",
                is_occupied=False,
                realm="Chưa ghi chép",
                realm_idx=0,
                title="Chưa tu tập",
                hp=50,
                max_hp=50,
                score=0,
                words_slain=0,
                band_idx=0,
                talents={}
            )
            slot3 = MeowchaSave(
                slot_id=3,
                slot_name="FILE 3 - Thử Nghiệm",
                is_occupied=False,
                realm="Chưa ghi chép",
                realm_idx=0,
                title="Chưa tu tập",
                hp=50,
                max_hp=50,
                score=0,
                words_slain=0,
                band_idx=0,
                talents={}
            )
            db.add_all([slot1, slot2, slot3])
            db.commit()
            logger.info("Đã tạo 3 Save Slots mẫu trong SQL.")

    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi trong quá trình seed database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_meowcha_database()
