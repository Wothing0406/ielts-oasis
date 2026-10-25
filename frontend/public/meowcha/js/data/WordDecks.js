/**
 * WordDecks.js - Kho Từ Vựng IELTS Tiên Đạo 5 Cảnh Giới & 4 Đại Ngọc Giản
 * Tích hợp toàn diện 5,946 từ vựng Oxford 5000 CEFR, 1200 Thính Âm Bẫy Chính Tả, Cambridge Academic Reading
 */
(function(root) {
  const REALM_DECKS = {
    0: [
      {
            "word": "ABOUT",
            "ipa": "/əˈbaʊt/",
            "type": "adverb",
            "meaning": "Xung quanh, quanh quẩn, đây đó, rải rác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abo/about/about__us_1.mp3"
      },
      {
            "word": "ABOUT",
            "ipa": "/əˈbaʊt/",
            "type": "preposition",
            "meaning": "Xung quanh, quanh quẩn, đây đó, rải rác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abo/about/about__us_1.mp3"
      },
      {
            "word": "ABOVE",
            "ipa": "/əˈbʌv/",
            "type": "adverb",
            "meaning": "Trên đầu, trên đỉnh đầu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abo/above/above__us_2.mp3"
      },
      {
            "word": "ABOVE",
            "ipa": "/əˈbʌv/",
            "type": "preposition",
            "meaning": "Trên đầu, trên đỉnh đầu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abo/above/above__us_2.mp3"
      },
      {
            "word": "ACROSS",
            "ipa": "/əˈkrɔːs/",
            "type": "adverb",
            "meaning": "Qua, ngang, ngang qua",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acr/acros/across__us_1.mp3"
      },
      {
            "word": "ACROSS",
            "ipa": "/əˈkrɔːs/",
            "type": "preposition",
            "meaning": "Qua, ngang, ngang qua",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acr/acros/across__us_1.mp3"
      },
      {
            "word": "ACTION",
            "ipa": "/ˈækʃn/",
            "type": "noun",
            "meaning": "Hành động, hành vi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/actio/action__us_2.mp3"
      },
      {
            "word": "ACTIVITY",
            "ipa": "/ækˈtɪvəti/",
            "type": "noun",
            "meaning": "Sự tích cực, sự hoạt động, sự nhanh nhẹn, sự linh lợi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/activ/activity__us_4.mp3"
      },
      {
            "word": "ACTOR",
            "ipa": "/ˈæktər/",
            "type": "noun",
            "meaning": "Diễn viên (kịch, tuồng, chèo, điện ảnh...)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/actor/actor__us_2.mp3"
      },
      {
            "word": "ACTRESS",
            "ipa": "/ˈæktrəs/",
            "type": "noun",
            "meaning": "Nữ diễn viên, đào hát",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/actre/actress__us_2.mp3"
      },
      {
            "word": "ADD",
            "ipa": "/æd/",
            "type": "verb",
            "meaning": "+ up, together) cộng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/add__/add__us_2.mp3"
      },
      {
            "word": "ADDRESS",
            "ipa": "/ˈædres/",
            "type": "noun",
            "meaning": "Địa chỉ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/addre/address__us_2_rr.mp3"
      },
      {
            "word": "ADULT",
            "ipa": "/ˈædʌlt/",
            "type": "noun",
            "meaning": "Người lớn, người đã trưởng thành",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adu/adult/adult__us_2_rr.mp3"
      },
      {
            "word": "ADVICE",
            "ipa": "/ədˈvaɪs/",
            "type": "noun",
            "meaning": "Lời khuyên, lời chỉ bảo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advic/advice__us_1.mp3"
      },
      {
            "word": "AFRAID",
            "ipa": "/əˈfreɪd/",
            "type": "adjective",
            "meaning": "Sợ, hãi, hoảng, hoảng sợ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/afr/afrai/afraid__us_2.mp3"
      },
      {
            "word": "AFTER",
            "ipa": "/ˈæftər/",
            "type": "preposition",
            "meaning": "Sau, đằng sau",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aft/after/after__us_2.mp3"
      },
      {
            "word": "AFTERNOON",
            "ipa": "/ˌæftərˈnuːn/",
            "type": "noun",
            "meaning": "Buổi chiều",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aft/after/afternoon__us_2.mp3"
      },
      {
            "word": "AGAIN",
            "ipa": "/əˈɡeɪn/",
            "type": "adverb",
            "meaning": "Lại, lần nữa, nữa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aga/again/again__us_1.mp3"
      },
      {
            "word": "AGE",
            "ipa": "/eɪdʒ/",
            "type": "noun",
            "meaning": "Tuổi già, tuổi tác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/age/age__/age__us_1.mp3"
      },
      {
            "word": "AGO",
            "ipa": "/əˈɡəʊ/",
            "type": "adverb",
            "meaning": "Trước đây, về trước",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ago/ago__/ago__us_1.mp3"
      },
      {
            "word": "AGREE",
            "ipa": "/əˈɡriː/",
            "type": "verb",
            "meaning": "Đồng ý, tán thành, bằng lòng, thoả thuận",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/agr/agree/agree__us_1.mp3"
      },
      {
            "word": "AIR",
            "ipa": "/er/",
            "type": "noun",
            "meaning": "Không khí, bầu không khí",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/air/air__/air__us_1.mp3"
      },
      {
            "word": "AIRPORT",
            "ipa": "/ˈerpɔːrt/",
            "type": "noun",
            "meaning": "Sân bay, phi trường",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/air/airpo/airport__us_1.mp3"
      },
      {
            "word": "ALL",
            "ipa": "/ɔːl/",
            "type": "determiner",
            "meaning": "Tất cả, hết thảy, toàn bộ, suốt trọn, mọi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/all__/all__us_1.mp3"
      },
      {
            "word": "ALL",
            "ipa": "/ɔːl/",
            "type": "pronoun",
            "meaning": "Tất cả, hết thảy, toàn bộ, suốt trọn, mọi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/all__/all__us_1.mp3"
      },
      {
            "word": "ALSO",
            "ipa": "/ˈɔːlsəʊ/",
            "type": "adverb",
            "meaning": "Cũng, cũng vầy, cũng thế",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/als/also_/also__us_3.mp3"
      },
      {
            "word": "ALWAYS",
            "ipa": "/ˈɔːlweɪz/",
            "type": "adverb",
            "meaning": "Luôn luôn, lúc nào cũng, bao giờ cũng, mãi mãi, hoài",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alw/alway/always__us_1_rr.mp3"
      },
      {
            "word": "AMAZING",
            "ipa": "/əˈmeɪzɪŋ/",
            "type": "adjective",
            "meaning": "Làm kinh ngạc, làm sửng sốt, làm hết sức ngạc nhiên",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ama/amazi/amazing__us_2.mp3"
      },
      {
            "word": "AND",
            "ipa": "/ænd/",
            "type": "conjunction",
            "meaning": "Và, cùng, với",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/and/and__/and__us_1.mp3"
      },
      {
            "word": "ANGRY",
            "ipa": "/ˈæŋɡri/",
            "type": "adjective",
            "meaning": "Giận, tức giận, cáu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ang/angry/angry__us_1.mp3"
      },
      {
            "word": "ANIMAL",
            "ipa": "/ˈænɪml/",
            "type": "noun",
            "meaning": "Động vật, thú vật",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ani/anima/animal__us_1.mp3"
      },
      {
            "word": "ANOTHER",
            "ipa": "/əˈnʌðər/",
            "type": "determiner",
            "meaning": "Nữa, thêm... nữa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ano/anoth/another__us_2.mp3"
      },
      {
            "word": "ANOTHER",
            "ipa": "/əˈnʌðər/",
            "type": "pronoun",
            "meaning": "Nữa, thêm... nữa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ano/anoth/another__us_2.mp3"
      },
      {
            "word": "ANSWER",
            "ipa": "/ˈænsər/",
            "type": "noun",
            "meaning": "Sự trả lời",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ans/answe/answer__us_1.mp3"
      },
      {
            "word": "ANSWER",
            "ipa": "/ˈænsər/",
            "type": "verb",
            "meaning": "Trả lời, đáp lại",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ans/answe/answer__us_1.mp3"
      },
      {
            "word": "ABILITY",
            "ipa": "/əˈbɪləti/",
            "type": "noun",
            "meaning": "Năng lực, khả năng (làm việc gì)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abi/abili/ability__us_4.mp3"
      },
      {
            "word": "ABLE",
            "ipa": "/ˈeɪbl/",
            "type": "adjective",
            "meaning": "Có năng lực, có tài",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abl/able_/able__us_2.mp3"
      },
      {
            "word": "ABROAD",
            "ipa": "/əˈbrɔːd/",
            "type": "adverb",
            "meaning": "Ở nước ngoài, ra nước ngoài",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abr/abroa/abroad__us_4.mp3"
      },
      {
            "word": "ACCEPT",
            "ipa": "/əkˈsept/",
            "type": "verb",
            "meaning": "Nhận, chấp nhận, chấp thuận",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accep/accept__us_1.mp3"
      },
      {
            "word": "ACCIDENT",
            "ipa": "/ˈæksɪdənt/",
            "type": "noun",
            "meaning": "Sự rủi ro, tai nạn, tai biến",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accid/accident__us_2_rr.mp3"
      },
      {
            "word": "ACHIEVE",
            "ipa": "/əˈtʃiːv/",
            "type": "verb",
            "meaning": "Đạt được, giành được",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ach/achie/achieve__us_2.mp3"
      },
      {
            "word": "ACT",
            "ipa": "/ækt/",
            "type": "verb",
            "meaning": "Đóng vai (kịch, chèo, tuồng, phim)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/act__/act__us_2.mp3"
      },
      {
            "word": "ACTIVE",
            "ipa": "/ˈæktɪv/",
            "type": "adjective",
            "meaning": "Tích cực, hoạt động",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/activ/active__us_2.mp3"
      },
      {
            "word": "ACTUALLY",
            "ipa": "/ˈæktʃuəli/",
            "type": "adverb",
            "meaning": "thực sự, thật ra, quả thật, đúng, quả là",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/actua/actually__us_1_rr.mp3"
      },
      {
            "word": "ADULT",
            "ipa": "/ˈædʌlt/",
            "type": "adjective",
            "meaning": "Trưởng thành",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adu/adult/adult__us_2_rr.mp3"
      },
      {
            "word": "ADVANTAGE",
            "ipa": "/ədˈvæntɪdʒ/",
            "type": "noun",
            "meaning": "Sự thuận lợi, hoàn cảnh thuận lợi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advan/advantage__us_1.mp3"
      },
      {
            "word": "ADVENTURE",
            "ipa": "/ədˈventʃər/",
            "type": "noun",
            "meaning": "Sự phiêu lưu, sự mạo hiểm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/adven/adventure__us_3.mp3"
      },
      {
            "word": "ADVERTISE",
            "ipa": "/ˈædvərtaɪz/",
            "type": "verb",
            "meaning": "Báo cho biết, báo cho ai biết trước",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/adver/advertise__us_1.mp3"
      },
      {
            "word": "ADVERTISEMENT",
            "ipa": "/ˌædvərˈtaɪzmənt/",
            "type": "noun",
            "meaning": "Sự quảng cáo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/adver/advertisement__us_2_rr.mp3"
      },
      {
            "word": "ADVERTISING",
            "ipa": "/ˈædvərtaɪzɪŋ/",
            "type": "noun",
            "meaning": "Sự quảng cáo, nghề quảng cáo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/adver/advertising__us_1.mp3"
      },
      {
            "word": "AFFECT",
            "ipa": "/əˈfekt/",
            "type": "verb",
            "meaning": "Làm ảnh hưởng đến, làm tác động đến",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aff/affec/affect__us_1.mp3"
      },
      {
            "word": "AFTER",
            "ipa": "/ˈæftər/",
            "type": "adverb",
            "meaning": "Sau, đằng sau",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aft/after/after__us_2.mp3"
      },
      {
            "word": "AFTER",
            "ipa": "/ˈæftər/",
            "type": "conjunction",
            "meaning": "Sau khi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aft/after/after__us_2.mp3"
      },
      {
            "word": "AGAINST",
            "ipa": "/əˈɡeɪnst/",
            "type": "preposition",
            "meaning": "Chống lại, ngược lại, phản đối",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aga/again/against__us_1.mp3"
      },
      {
            "word": "AIRLINE",
            "ipa": "/ˈerlaɪn/",
            "type": "noun",
            "meaning": "Công ty hàng không",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/air/airli/airline__us_1.mp3"
      },
      {
            "word": "ALIVE",
            "ipa": "/əˈlaɪv/",
            "type": "adjective",
            "meaning": "Sống, còn sống, đang sống",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ali/alive/alive__us_2.mp3"
      },
      {
            "word": "ALL",
            "ipa": "/ɔːl/",
            "type": "adverb",
            "meaning": "Hoàn toàn, toàn bộ, tất cả, trọn vẹn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/all__/all__us_1.mp3"
      },
      {
            "word": "ALLOW",
            "ipa": "/əˈlaʊ/",
            "type": "verb",
            "meaning": "Cho phép, để cho",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/allow/allow__us_2.mp3"
      },
      {
            "word": "ALMOST",
            "ipa": "/ˈɔːlməʊst/",
            "type": "adverb",
            "meaning": "Hầu (như), gần (như), suýt nữa, tí nữa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alm/almos/almost__us_1_rr.mp3"
      },
      {
            "word": "ALONE",
            "ipa": "/əˈləʊn/",
            "type": "adjective",
            "meaning": "Một mình, trơ trọi, cô độc, đơn độc",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alo/alone/alone__us_1.mp3"
      }
],
    1: [
      {
            "word": "ABSOLUTELY",
            "ipa": "/ˈæbsəluːtli/",
            "type": "adverb",
            "meaning": "Tuyệt đối, hoàn toàn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/absol/absolutely__us_1_rr.mp3"
      },
      {
            "word": "ACADEMIC",
            "ipa": "/ˌækəˈdemɪk/",
            "type": "adjective",
            "meaning": "Học viện",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aca/acade/academic__us_2.mp3"
      },
      {
            "word": "ACCESS",
            "ipa": "/ˈækses/",
            "type": "noun",
            "meaning": "Lối vào, cửa vào, đường vào",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/acces/access__us_2.mp3"
      },
      {
            "word": "ACCESS",
            "ipa": "/ˈækses/",
            "type": "verb",
            "meaning": "truy cập",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/acces/access__us_2.mp3"
      },
      {
            "word": "ACCOMMODATION",
            "ipa": "/əˌkɑːməˈdeɪʃn/",
            "type": "noun",
            "meaning": "Sự điều tiết, sự thích nghi, sự làm cho phù hợp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accom/accommodation__us_2.mp3"
      },
      {
            "word": "ACCOUNT",
            "ipa": "/əˈkaʊnt/",
            "type": "noun",
            "meaning": "Sự tính toán",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accou/account__us_1.mp3"
      },
      {
            "word": "ACCOUNTING",
            "ipa": "/əˈkaʊntɪŋ/",
            "type": "noun",
            "meaning": "Sự thanh toán, sự tính toán (tiền nong, sổ sách)",
            "audio_url": "https://www.oxfordlearnersdictionaries.comundefined"
      },
      {
            "word": "ACHIEVEMENT",
            "ipa": "/əˈtʃiːvmənt/",
            "type": "noun",
            "meaning": "Thành tích, thành tựu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ach/achie/achievement__us_1.mp3"
      },
      {
            "word": "ACT",
            "ipa": "/ækt/",
            "type": "noun",
            "meaning": "Hành động, việc làm, cử chỉ, hành vi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/act__/act__us_2.mp3"
      },
      {
            "word": "ADDITION",
            "ipa": "/əˈdɪʃn/",
            "type": "noun",
            "meaning": "Tính cộng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/addit/addition__us_2.mp3"
      },
      {
            "word": "ADMIRE",
            "ipa": "/ədˈmaɪər/",
            "type": "verb",
            "meaning": "Ngắm nhìn một cách vui thích",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admir/admire__us_1.mp3"
      },
      {
            "word": "ADMIT",
            "ipa": "/ədˈmɪt/",
            "type": "verb",
            "meaning": "Nhận vào, cho vào",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admit/admit__us_2.mp3"
      },
      {
            "word": "ADVANCED",
            "ipa": "/ədˈvænst/",
            "type": "adjective",
            "meaning": "Tiên tiến, tiến bộ, cấp tiến",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advan/advanced__us_1.mp3"
      },
      {
            "word": "ADVISE",
            "ipa": "/ədˈvaɪz/",
            "type": "verb",
            "meaning": "Khuyên, khuyên bảo, răn bảo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advis/advise__us_1.mp3"
      },
      {
            "word": "AFFORD",
            "ipa": "/əˈfɔːrd/",
            "type": "verb",
            "meaning": "Có thể, có đủ sức, có đủ khả năng, có đủ điều kiện (để làm gì)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aff/affor/afford__us_1.mp3"
      },
      {
            "word": "AGE",
            "ipa": "/eɪdʒ/",
            "type": "verb",
            "meaning": "Tuổi già, tuổi tác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/age/age__/age__us_1.mp3"
      },
      {
            "word": "AGED",
            "ipa": "/.../",
            "type": "adjective",
            "meaning": "Làm cho già đi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/age/aged_/aged__us_1.mp3"
      },
      {
            "word": "AGENT",
            "ipa": "/ˈeɪdʒənt/",
            "type": "noun",
            "meaning": "Người đại lý",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/age/agent/agent__us_2.mp3"
      },
      {
            "word": "AGREEMENT",
            "ipa": "/əˈɡriːmənt/",
            "type": "noun",
            "meaning": "hiệp định, hiệp nghị",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/agr/agree/agreement__us_1.mp3"
      },
      {
            "word": "AHEAD",
            "ipa": "/əˈhed/",
            "type": "adverb",
            "meaning": "Trước, về phía trước, ở thẳng phía trước",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ahe/ahead/ahead__us_1.mp3"
      },
      {
            "word": "AIM",
            "ipa": "/eɪm/",
            "type": "noun",
            "meaning": "Sự nhắm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aim/aim__/aim__us_1.mp3"
      },
      {
            "word": "AIM",
            "ipa": "/eɪm/",
            "type": "verb",
            "meaning": "Nhắm, chĩa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aim/aim__/aim__us_1.mp3"
      },
      {
            "word": "ALARM",
            "ipa": "/əˈlɑːrm/",
            "type": "noun",
            "meaning": "Sự báo động, sự báo nguy",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ala/alarm/alarm__us_1.mp3"
      },
      {
            "word": "ALBUM",
            "ipa": "/ˈælbəm/",
            "type": "noun",
            "meaning": "Tập ảnh, quyển album",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alb/album/album__us_2.mp3"
      },
      {
            "word": "ALCOHOL",
            "ipa": "/ˈælkəhɔːl/",
            "type": "noun",
            "meaning": "Rượu cồn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alc/alcoh/alcohol__us_1_rr.mp3"
      },
      {
            "word": "ALCOHOLIC",
            "ipa": "/ˌælkəˈhɑːlɪk/",
            "type": "adjective",
            "meaning": "Người nghiện rượu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alc/alcoh/alcoholic__us_2_rr.mp3"
      },
      {
            "word": "ALTERNATIVE",
            "ipa": "/ɔːlˈtɜːrnətɪv/",
            "type": "adjective",
            "meaning": "Xen nhau",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alt/alter/alternative__us_1.mp3"
      },
      {
            "word": "AMAZED",
            "ipa": "/əˈmeɪzd/",
            "type": "adjective",
            "meaning": "Quá khứ và phân từ quá khứ của amaze",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ama/amaze/amazed__us_2.mp3"
      },
      {
            "word": "AMBITION",
            "ipa": "/æmˈbɪʃn/",
            "type": "noun",
            "meaning": "Hoài bão, khát vọng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/amb/ambit/ambition__us_2.mp3"
      },
      {
            "word": "AMBITIOUS",
            "ipa": "/æmˈbɪʃəs/",
            "type": "adjective",
            "meaning": "Có nhiều hoài bão, có nhiều khát vọng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/amb/ambit/ambitious__us_2.mp3"
      },
      {
            "word": "ANALYSE",
            "ipa": "/ˈænəlaɪz/",
            "type": "verb",
            "meaning": "Phân tích",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ana/analy/analyse__us_2.mp3"
      },
      {
            "word": "ANALYSIS",
            "ipa": "/əˈnæləsɪs/",
            "type": "noun",
            "meaning": "Sự phân tích",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ana/analy/analysis__us_2.mp3"
      },
      {
            "word": "ANGRILY",
            "ipa": "/ˈæŋɡrəli/",
            "type": "adverb",
            "meaning": "Tức giận, giận dữ",
            "audio_url": "https://www.oxfordlearnersdictionaries.comundefined"
      },
      {
            "word": "ANNOUNCE",
            "ipa": "/əˈnaʊns/",
            "type": "verb",
            "meaning": "Báo, loan báo, thông tri",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ann/annou/announce__us_1.mp3"
      },
      {
            "word": "ANNOUNCEMENT",
            "ipa": "/əˈnaʊnsmənt/",
            "type": "noun",
            "meaning": "Lời rao, lời loan báo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ann/annou/announcement__us_1.mp3"
      },
      {
            "word": "ANNOY",
            "ipa": "/əˈnɔɪ/",
            "type": "verb",
            "meaning": "Làm trái ý, làm khó chịu, làm bực mình",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ann/annoy/annoy__us_1.mp3"
      },
      {
            "word": "ANNOYED",
            "ipa": "/əˈnɔɪd/",
            "type": "adjective",
            "meaning": "Bị trái ý, khó chịu, bực mình",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ann/annoy/annoyed__us_3.mp3"
      },
      {
            "word": "ANNOYING",
            "ipa": "/əˈnɔɪɪŋ/",
            "type": "adjective",
            "meaning": "Làm trái ý, làm khó chịu, làm bực mình",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ann/annoy/annoying__us_3.mp3"
      },
      {
            "word": "APART",
            "ipa": "/əˈpɑːrt/",
            "type": "adverb",
            "meaning": "Về một bên, qua một bên",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/apa/apart/apart__us_1.mp3"
      },
      {
            "word": "APOLOGIZE",
            "ipa": "/əˈpɑːlədʒaɪz/",
            "type": "verb",
            "meaning": "Xin lỗi, tạ lỗi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/apo/apolo/apologize__us_1.mp3"
      },
      {
            "word": "APPLICATION",
            "ipa": "/ˌæplɪˈkeɪʃn/",
            "type": "noun",
            "meaning": "Sự gắn vào, sự áp vào, sự ghép vào, sự đính vào, sự đắp vào, sự tra vào ((cũng) appliance)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appli/application__us_2.mp3"
      },
      {
            "word": "APPOINTMENT",
            "ipa": "/əˈpɔɪntmənt/",
            "type": "noun",
            "meaning": "Được bổ nhiệm, chức vụ được bổ nhiệm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appoi/appointment__us_1.mp3"
      },
      {
            "word": "APPRECIATE",
            "ipa": "/əˈpriːʃieɪt/",
            "type": "verb",
            "meaning": "Đánh giá",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appre/appreciate__us_1.mp3"
      },
      {
            "word": "APPROXIMATELY",
            "ipa": "/əˈprɑːksɪmətli/",
            "type": "adverb",
            "meaning": "Khoảng chừng, độ chừng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appro/approximately__us_1.mp3"
      },
      {
            "word": "ARREST",
            "ipa": "/əˈrest/",
            "type": "noun",
            "meaning": "Sự bắt giữ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/arr/arres/arrest__us_1.mp3"
      },
      {
            "word": "ARREST",
            "ipa": "/əˈrest/",
            "type": "verb",
            "meaning": "Bắt giữ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/arr/arres/arrest__us_1.mp3"
      },
      {
            "word": "ARRIVAL",
            "ipa": "/əˈraɪvl/",
            "type": "noun",
            "meaning": "Sự đến, sự tới nơi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/arr/arriv/arrival__us_3.mp3"
      },
      {
            "word": "ASSIGNMENT",
            "ipa": "/əˈsaɪnmənt/",
            "type": "noun",
            "meaning": "Sự giao việc, sự phân công",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/assig/assignment__us_1.mp3"
      },
      {
            "word": "ASSIST",
            "ipa": "/əˈsɪst/",
            "type": "verb",
            "meaning": "Giúp, giúp đỡ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/assis/assist__us_1.mp3"
      },
      {
            "word": "ATMOSPHERE",
            "ipa": "/ˈætməsfɪr/",
            "type": "noun",
            "meaning": "Quyển khí",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/atm/atmos/atmosphere__us_2.mp3"
      }
],
    2: [
      {
            "word": "ABANDON",
            "ipa": "/əˈbændən/",
            "type": "verb",
            "meaning": "Sự phóng túng, sự tự do, sự buông thả",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aba/aband/abandon__us_2.mp3"
      },
      {
            "word": "ABSOLUTE",
            "ipa": "/ˈæbsəluːt/",
            "type": "adjective",
            "meaning": "Tuyệt đối, hoàn toàn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/absol/absolute__us_1_rr.mp3"
      },
      {
            "word": "ABSORB",
            "ipa": "/əbˈzɔːrb/",
            "type": "verb",
            "meaning": "Hút, hút thu (nước)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/absor/absorb__us_2_rr.mp3"
      },
      {
            "word": "ABSTRACT",
            "ipa": "/ˈæbstrækt/",
            "type": "adjective",
            "meaning": "Trừu tượng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/abstr/abstract__us_2_rr.mp3"
      },
      {
            "word": "ACADEMIC",
            "ipa": "/ˌækəˈdemɪk/",
            "type": "noun",
            "meaning": "Hội viên học viện",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aca/acade/academic__us_2.mp3"
      },
      {
            "word": "ACCENT",
            "ipa": "/ˈæksənt/",
            "type": "noun",
            "meaning": "Trọng âm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accen/accent__us_1_rr.mp3"
      },
      {
            "word": "ACCEPTABLE",
            "ipa": "/əkˈseptəbl/",
            "type": "adjective",
            "meaning": "Có thể nhận, có thể chấp nhận",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accep/acceptable__us_3.mp3"
      },
      {
            "word": "ACCIDENTALLY",
            "ipa": "/ˌæksɪˈdentəli/",
            "type": "adverb",
            "meaning": "Tình cờ, ngẫu nhiên",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accid/accidentally__us_1.mp3"
      },
      {
            "word": "ACCOMMODATE",
            "ipa": "/əˈkɑːmədeɪt/",
            "type": "verb",
            "meaning": "Điều tiết, làm cho thích nghi, làm cho phù hợp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accom/accommodate__us_1.mp3"
      },
      {
            "word": "ACCOMPANY",
            "ipa": "/əˈkʌmpəni/",
            "type": "verb",
            "meaning": "Đi theo, đi cùng, đi kèm, đồng hành",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accom/accompany__us_2.mp3"
      },
      {
            "word": "ACCOMPLISH",
            "ipa": "/əˈkɑːmplɪʃ/",
            "type": "verb",
            "meaning": "Hoàn thành, làm xong, làm trọn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accom/accomplish__us_1.mp3"
      },
      {
            "word": "ACCOUNT",
            "ipa": "/əˈkaʊnt/",
            "type": "verb",
            "meaning": "Coi, coi như, coi là, cho là",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accou/account__us_1.mp3"
      },
      {
            "word": "ACCOUNTANT",
            "ipa": "/əˈkaʊntənt/",
            "type": "noun",
            "meaning": "Nhân viên kế toán, người giữ sổ sách kế toán",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accou/accountant__us_1.mp3"
      },
      {
            "word": "ACCURACY",
            "ipa": "/ˈækjərəsi/",
            "type": "noun",
            "meaning": "Sự đúng đắn, sự chính xác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accur/accuracy__us_1.mp3"
      },
      {
            "word": "ACCURATE",
            "ipa": "/ˈækjərət/",
            "type": "adjective",
            "meaning": "Đúng đắn, chính xác, xác đáng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accur/accurate__us_1.mp3"
      },
      {
            "word": "ACCURATELY",
            "ipa": "/ˈækjərətli/",
            "type": "adverb",
            "meaning": "Đúng đắn, chính xác, xác đáng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accur/accurately__us_1.mp3"
      },
      {
            "word": "ACCUSE",
            "ipa": "/əˈkjuːz/",
            "type": "verb",
            "meaning": "Cáo buộc, buộc tội, kết tội",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accus/accuse__us_2.mp3"
      },
      {
            "word": "ACID",
            "ipa": "/ˈæsɪd/",
            "type": "noun",
            "meaning": "Chất chua",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aci/acid_/acid__us_1.mp3"
      },
      {
            "word": "ACKNOWLEDGE",
            "ipa": "/əkˈnɑːlɪdʒ/",
            "type": "verb",
            "meaning": "Nhận, thừa nhận, công nhận",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ack/ackno/acknowledge__us_1.mp3"
      },
      {
            "word": "ACQUIRE",
            "ipa": "/əˈkwaɪər/",
            "type": "verb",
            "meaning": "đạt được; tiếp thu, học được",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acq/acqui/acquire__us_2.mp3"
      },
      {
            "word": "ACTIVATE",
            "ipa": "/ˈæktɪveɪt/",
            "type": "verb",
            "meaning": "Hoạt hoá, làm hoạt động",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/activ/activate__us_1.mp3"
      },
      {
            "word": "ACTUAL",
            "ipa": "/ˈæktʃuəl/",
            "type": "adjective",
            "meaning": "Thật sự, thật, thực tế, có thật",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/actua/actual__us_1_rr.mp3"
      },
      {
            "word": "ADAPT",
            "ipa": "/əˈdæpt/",
            "type": "verb",
            "meaning": "Tra vào, lắp vào",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ada/adapt/adapt__us_1.mp3"
      },
      {
            "word": "ADDICTION",
            "ipa": "/əˈdɪkʃn/",
            "type": "noun",
            "meaning": "Thói nghiện",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/addic/addiction__us_1.mp3"
      },
      {
            "word": "ADDITIONAL",
            "ipa": "/əˈdɪʃənl/",
            "type": "adjective",
            "meaning": "Thêm vào, phụ vào, tăng thêm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/addit/additional__us_3.mp3"
      },
      {
            "word": "ADDITIONALLY",
            "ipa": "/əˈdɪʃənəli/",
            "type": "adverb",
            "meaning": "Thêm nữa, ngoài ra",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/addit/additionally__us_1.mp3"
      },
      {
            "word": "ADDRESS",
            "ipa": "/əˈdres/",
            "type": "verb",
            "meaning": "Đề địa chỉ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/add/addre/address__us_2_rr.mp3"
      },
      {
            "word": "ADEQUATE",
            "ipa": "/ˈædɪkwət/",
            "type": "adjective",
            "meaning": "Đủ, đầy đủ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ade/adequ/adequate__us_1.mp3"
      },
      {
            "word": "ADEQUATELY",
            "ipa": "/ˈædɪkwətli/",
            "type": "adverb",
            "meaning": "Tương xứng, thích đáng, thoả đáng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ade/adequ/adequately__us_1.mp3"
      },
      {
            "word": "ADJUST",
            "ipa": "/əˈdʒʌst/",
            "type": "verb",
            "meaning": "Sửa lại cho đúng, điều chỉnh",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adj/adjus/adjust__us_1.mp3"
      },
      {
            "word": "ADMINISTRATION",
            "ipa": "/ədˌmɪnɪˈstreɪʃn/",
            "type": "noun",
            "meaning": "Sự trông nom, sự quản lý",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admin/administration__us_1.mp3"
      },
      {
            "word": "ADOPT",
            "ipa": "/əˈdɑːpt/",
            "type": "verb",
            "meaning": "Nhận làm con nuôi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ado/adopt/adopt__us_1.mp3"
      },
      {
            "word": "ADVANCE",
            "ipa": "/ədˈvæns/",
            "type": "adjective",
            "meaning": "Sự tiến lên, sự tiến tới, sự tiến bộ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advan/advance__us_1.mp3"
      },
      {
            "word": "ADVANCE",
            "ipa": "/ədˈvæns/",
            "type": "noun",
            "meaning": "Sự tiến lên, sự tiến tới, sự tiến bộ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advan/advance__us_1.mp3"
      },
      {
            "word": "ADVANCE",
            "ipa": "/ədˈvæns/",
            "type": "verb",
            "meaning": "Đưa lên, đưa ra phía trước",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advan/advance__us_1.mp3"
      },
      {
            "word": "AFFAIR",
            "ipa": "/əˈfer/",
            "type": "noun",
            "meaning": "Công việc, việc làm, sự vụ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aff/affai/affair__us_2.mp3"
      },
      {
            "word": "AFFORDABLE",
            "ipa": "/əˈfɔːrdəbl/",
            "type": "adjective",
            "meaning": "Không đắt: nice clothes at affordable prices",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aff/affor/affordable__us_1.mp3"
      },
      {
            "word": "AFTERWARDS",
            "ipa": "/ˈæftərwərdz/",
            "type": "adverb",
            "meaning": "Sau này, về sau, sau đấy, rồi thì",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aft/after/afterwards__us_2.mp3"
      },
      {
            "word": "AGENCY",
            "ipa": "/ˈeɪdʒənsi/",
            "type": "noun",
            "meaning": "Tác dụng, lực",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/age/agenc/agency__us_2.mp3"
      },
      {
            "word": "AGENDA",
            "ipa": "/əˈdʒendə/",
            "type": "noun",
            "meaning": "Những việc phải làm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/age/agend/agenda__us_2.mp3"
      },
      {
            "word": "AGGRESSIVE",
            "ipa": "/əˈɡresɪv/",
            "type": "adjective",
            "meaning": "Xâm lược, xâm lăng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/agg/aggre/aggressive__us_1.mp3"
      },
      {
            "word": "AGRICULTURE",
            "ipa": "/ˈæɡrɪkʌltʃər/",
            "type": "noun",
            "meaning": "Nông nghiệp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/agr/agric/agriculture__us_1.mp3"
      },
      {
            "word": "AID",
            "ipa": "/eɪd/",
            "type": "noun",
            "meaning": "Sự giúp đỡ, sự cứu giúp, sự viện trợ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aid/aid__/aid__us_1.mp3"
      },
      {
            "word": "AID",
            "ipa": "/eɪd/",
            "type": "verb",
            "meaning": "Sự giúp đỡ, sự cứu giúp, sự viện trợ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aid/aid__/aid__us_1.mp3"
      },
      {
            "word": "AIDS",
            "ipa": "/eɪdz/",
            "type": "noun",
            "meaning": "AIDS, hội chứng suy giảm miễn dịch mắc phải",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aid/aids_/aids__us_1.mp3"
      },
      {
            "word": "AIRCRAFT",
            "ipa": "/ˈerkræft/",
            "type": "noun",
            "meaning": "Máy bay, tàu bay",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/air/aircr/aircraft__us_1.mp3"
      },
      {
            "word": "ALARM",
            "ipa": "/əˈlɑːrm/",
            "type": "verb",
            "meaning": "Sự báo động, sự báo nguy",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ala/alarm/alarm__us_1.mp3"
      },
      {
            "word": "ALIEN",
            "ipa": "/ˈeɪliən/",
            "type": "noun",
            "meaning": "Người xa lạ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ali/alien/alien__us_1_rr.mp3"
      },
      {
            "word": "ALONGSIDE",
            "ipa": "/əˌlɔːŋˈsaɪd/",
            "type": "preposition",
            "meaning": "Sát cạnh, kế bên, dọc theo, dọc",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alo/along/alongside__us_2.mp3"
      },
      {
            "word": "ALTER",
            "ipa": "/ˈɔːltər/",
            "type": "verb",
            "meaning": "Thay đổi, biến đổi, đổi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alt/alter/alter__us_4.mp3"
      }
],
    3: [
      {
            "word": "ABOLISH",
            "ipa": "/əˈbɑːlɪʃ/",
            "type": "verb",
            "meaning": "Thủ tiêu, bãi bỏ, huỷ bỏ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abo/aboli/abolish__us_1.mp3"
      },
      {
            "word": "ABORTION",
            "ipa": "/əˈbɔːrʃn/",
            "type": "noun",
            "meaning": "Sự sẩy thai, sự phá thai",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abo/abort/abortion__us_1.mp3"
      },
      {
            "word": "ABSENCE",
            "ipa": "/ˈæbsəns/",
            "type": "noun",
            "meaning": "Sự vắng mặt, sự nghỉ (học), sự đi vắng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/absen/absence__us_1.mp3"
      },
      {
            "word": "ABSENT",
            "ipa": "/ˈæbsənt/",
            "type": "adjective",
            "meaning": "Vắng mặt, đi vắng, nghỉ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/absen/absent__us_1.mp3"
      },
      {
            "word": "ABSURD",
            "ipa": "/əbˈsɜːrd/",
            "type": "adjective",
            "meaning": "Ngu xuẩn, ngớ ngẩn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abs/absur/absurd__us_1_rr.mp3"
      },
      {
            "word": "ABUNDANCE",
            "ipa": "/əˈbʌndəns/",
            "type": "noun",
            "meaning": "Sự nhiều, sự giàu có, sự phong phú",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abu/abund/abundance__us_1.mp3"
      },
      {
            "word": "ABUSE",
            "ipa": "/əˈbjuːs/",
            "type": "noun",
            "meaning": "Sự lạm dụng, sự lộng hành",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abu/abuse/abuse__us_3.mp3"
      },
      {
            "word": "ABUSE",
            "ipa": "/əˈbjuːz/",
            "type": "verb",
            "meaning": "Lạm dụng (quyền hành... )",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/abu/abuse/abuse__us_1.mp3"
      },
      {
            "word": "ACADEMY",
            "ipa": "/əˈkædəmi/",
            "type": "noun",
            "meaning": "Học viện",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aca/acade/academy__us_1.mp3"
      },
      {
            "word": "ACCELERATE",
            "ipa": "/əkˈseləreɪt/",
            "type": "verb",
            "meaning": "Làm nhanh thêm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accel/accelerate__us_1.mp3"
      },
      {
            "word": "ACCEPTANCE",
            "ipa": "/əkˈseptəns/",
            "type": "noun",
            "meaning": "Sự nhận, sự chấp nhận, sự chấp thuận",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accep/acceptance__us_1.mp3"
      },
      {
            "word": "ACCESSIBLE",
            "ipa": "/əkˈsesəbl/",
            "type": "adjective",
            "meaning": "Có thể tới được, có thể gần được",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/acces/accessible__us_1.mp3"
      },
      {
            "word": "ACCOMPLISHMENT",
            "ipa": "/əˈkɑːmplɪʃmənt/",
            "type": "noun",
            "meaning": "Sự hoàn thành, sự làm xong, sự làm trọn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accom/accomplishment__us_1.mp3"
      },
      {
            "word": "ACCORDANCE",
            "ipa": "/əˈkɔːrdns/",
            "type": "noun",
            "meaning": "Sự đồng ý, sự thoả thuận (với ai)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accor/accordance__us_1.mp3"
      },
      {
            "word": "ACCORDINGLY",
            "ipa": "/əˈkɔːrdɪŋli/",
            "type": "adverb",
            "meaning": "Do đó, vì vậy, cho nên",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accor/accordingly__us_1.mp3"
      },
      {
            "word": "ACCOUNTABILITY",
            "ipa": "/əˌkaʊntəˈbɪləti/",
            "type": "noun",
            "meaning": "Năng lực chịu trách nhiệm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accou/accountability__us_1.mp3"
      },
      {
            "word": "ACCOUNTABLE",
            "ipa": "/əˈkaʊntəbl/",
            "type": "adjective",
            "meaning": "Chịu trách nhiệm, có trách nhiệm phải giải thích",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accou/accountable__us_1.mp3"
      },
      {
            "word": "ACCUMULATE",
            "ipa": "/əˈkjuːmjəleɪt/",
            "type": "verb",
            "meaning": "Chất đống, chồng chất, tích luỹ, gom góp lại",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accum/accumulate__us_1.mp3"
      },
      {
            "word": "ACCUMULATION",
            "ipa": "/əˌkjuːmjəˈleɪʃn/",
            "type": "noun",
            "meaning": "sự chất đống, sự chồng chất, sự tích luỹ, sự tích lại, sự tích tụ, sự góp nhặt",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accum/accumulation__us_1.mp3"
      },
      {
            "word": "ACCUSATION",
            "ipa": "/ˌækjuˈzeɪʃn/",
            "type": "noun",
            "meaning": "Sự kết tội, sự buộc tội",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accus/accusation__us_1.mp3"
      },
      {
            "word": "ACCUSED",
            "ipa": "/ði əˈkjuːzd/",
            "type": "noun",
            "meaning": "Bị cáo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acc/accus/accused__us_1.mp3"
      },
      {
            "word": "ACID",
            "ipa": "/ˈæsɪd/",
            "type": "adjective",
            "meaning": "Thử thách gay go",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aci/acid_/acid__us_1.mp3"
      },
      {
            "word": "ACQUISITION",
            "ipa": "/ˌækwɪˈzɪʃn/",
            "type": "noun",
            "meaning": "sự tiếp thu, sự có được",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acq/acqui/acquisition__us_1.mp3"
      },
      {
            "word": "ACRE",
            "ipa": "/ˈeɪkər/",
            "type": "noun",
            "meaning": "Mẫu Anh (khoảng 0, 4 hecta)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acr/acre_/acre__us_1.mp3"
      },
      {
            "word": "ACTIVATION",
            "ipa": "/ˌæktɪˈveɪʃn/",
            "type": "noun",
            "meaning": "Sự hoạt hoá",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/activ/activation__us_1.mp3"
      },
      {
            "word": "ACTIVIST",
            "ipa": "/ˈæktɪvɪst/",
            "type": "noun",
            "meaning": "Nhà hoạt động xã hội, nhà hoạt động chính trị",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/act/activ/activist__us_1.mp3"
      },
      {
            "word": "ACUTE",
            "ipa": "/əˈkjuːt/",
            "type": "adjective",
            "meaning": "Sắc, sắc bén, sắc sảo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/acu/acute/acute__us_1.mp3"
      },
      {
            "word": "ADAPTATION",
            "ipa": "/ˌædæpˈteɪʃn/",
            "type": "noun",
            "meaning": "Sự tra vào, sự lắp vào",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ada/adapt/adaptation__us_1.mp3"
      },
      {
            "word": "ADHERE",
            "ipa": "/ədˈhɪr/",
            "type": "verb",
            "meaning": "Dính chặt vào, bám chặt vào",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adh/adher/adhere__us_1.mp3"
      },
      {
            "word": "ADJACENT",
            "ipa": "/əˈdʒeɪsnt/",
            "type": "adjective",
            "meaning": "Gần kề, kế liền, sát ngay",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adj/adjac/adjacent__us_1.mp3"
      },
      {
            "word": "ADJUSTMENT",
            "ipa": "/əˈdʒʌstmənt/",
            "type": "noun",
            "meaning": "Sự sửa lại cho đúng, sự điều chỉnh, sự chỉnh lý",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adj/adjus/adjustment__us_1.mp3"
      },
      {
            "word": "ADMINISTER",
            "ipa": "/ədˈmɪnɪstər/",
            "type": "verb",
            "meaning": "Trông nom, quản lý",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admin/administer__us_1.mp3"
      },
      {
            "word": "ADMINISTRATIVE",
            "ipa": "/ədˈmɪnɪstreɪtɪv/",
            "type": "adjective",
            "meaning": "Hành chính, (thuộc) quản trị",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admin/administrative__us_1_rr.mp3"
      },
      {
            "word": "ADMINISTRATOR",
            "ipa": "/ədˈmɪnɪstreɪtər/",
            "type": "noun",
            "meaning": "Người quản lý",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admin/administrator__us_1.mp3"
      },
      {
            "word": "ADMISSION",
            "ipa": "/ədˈmɪʃn/",
            "type": "noun",
            "meaning": "Sự nhận vào, sự thu nạp vào",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adm/admis/admission__us_1.mp3"
      },
      {
            "word": "ADOLESCENT",
            "ipa": "/ˌædəˈlesnt/",
            "type": "noun",
            "meaning": "Người thiếu niên",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ado/adole/adolescent__us_1.mp3"
      },
      {
            "word": "ADOPTION",
            "ipa": "/əˈdɑːpʃn/",
            "type": "noun",
            "meaning": "Sự nhận làm con nuôi",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ado/adopt/adoption__us_1.mp3"
      },
      {
            "word": "ADVERSE",
            "ipa": "/ˈædvɜːrs/",
            "type": "adjective",
            "meaning": "Đối địch, thù địch, nghịch lại, chống đối",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/adver/adverse__us_2_rr.mp3"
      },
      {
            "word": "ADVOCATE",
            "ipa": "/ˈædvəkət/",
            "type": "noun",
            "meaning": "Người biện hộ, người bào chữa, người bênh vực",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advoc/advocate__us_2.mp3"
      },
      {
            "word": "ADVOCATE",
            "ipa": "/ˈædvəkeɪt/",
            "type": "verb",
            "meaning": "Biện hộ, bào chữa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/adv/advoc/advocate__us_1.mp3"
      },
      {
            "word": "AESTHETIC",
            "ipa": "/esˈθetɪk/",
            "type": "adjective",
            "meaning": "Mỹ học, thẩm mỹ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aes/aesth/aesthetic__us_1_rr.mp3"
      },
      {
            "word": "AFFECTION",
            "ipa": "/əˈfekʃn/",
            "type": "noun",
            "meaning": "Sự làm ảnh hưởng đến, sự làm tác động đến",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aff/affec/affection__us_1.mp3"
      },
      {
            "word": "AFTERMATH",
            "ipa": "/ˈæftərmæθ/",
            "type": "noun",
            "meaning": "After-grass",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aft/after/aftermath__us_1.mp3"
      },
      {
            "word": "AGGRESSION",
            "ipa": "/əˈɡreʃn/",
            "type": "noun",
            "meaning": "Sự xâm lược, cuộc xâm lược",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/agg/aggre/aggression__us_1.mp3"
      },
      {
            "word": "AGRICULTURAL",
            "ipa": "/ˌæɡrɪˈkʌltʃərəl/",
            "type": "adjective",
            "meaning": "Nông nghiệp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/agr/agric/agricultural__us_1.mp3"
      },
      {
            "word": "AIDE",
            "ipa": "/eɪd/",
            "type": "noun",
            "meaning": "Sĩ quan phụ tá, sĩ quan hầu cận",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aid/aide_/aide__us_1.mp3"
      },
      {
            "word": "ALBEIT",
            "ipa": "/ˌɔːlˈbiːɪt/",
            "type": "conjunction",
            "meaning": "Mặc dù, dù, dẫu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alb/albei/albeit__us_1_rr.mp3"
      },
      {
            "word": "ALERT",
            "ipa": "/əˈlɜːrt/",
            "type": "adjective",
            "meaning": "Tỉnh táo, cảnh giác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ale/alert/alert__us_1.mp3"
      },
      {
            "word": "ALERT",
            "ipa": "/əˈlɜːrt/",
            "type": "noun",
            "meaning": "Sự báo động, sự báo nguy",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ale/alert/alert__us_1.mp3"
      },
      {
            "word": "ALERT",
            "ipa": "/əˈlɜːrt/",
            "type": "verb",
            "meaning": "Tỉnh táo, cảnh giác",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ale/alert/alert__us_1.mp3"
      }
],
    4: [
      {
            "word": "ALIGNMENT",
            "ipa": "/əˈlaɪnmənt/",
            "type": "noun",
            "meaning": "Sự sắp thẳng hàng, sự sắp hàng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ali/align/alignment__us_1.mp3"
      },
      {
            "word": "ALLEGATION",
            "ipa": "/ˌæləˈɡeɪʃn/",
            "type": "noun",
            "meaning": "Sự viện lý, sự viện lẽ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/alleg/allegation__us_1.mp3"
      },
      {
            "word": "ALLEGEDLY",
            "ipa": "/əˈledʒɪdli/",
            "type": "adverb",
            "meaning": "theo lời cáo buộc; được cho là",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/alleg/allegedly__us_1.mp3"
      },
      {
            "word": "ALLIANCE",
            "ipa": "/əˈlaɪəns/",
            "type": "noun",
            "meaning": "Sự liên minh, khối liên minh khối đồng minh",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/allia/alliance__us_1.mp3"
      },
      {
            "word": "ALLOCATE",
            "ipa": "/ˈæləkeɪt/",
            "type": "verb",
            "meaning": "Chỉ định",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/alloc/allocate__us_1.mp3"
      },
      {
            "word": "ALLOCATION",
            "ipa": "/ˌæləˈkeɪʃn/",
            "type": "noun",
            "meaning": "Sự chỉ định",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/alloc/allocation__us_1.mp3"
      },
      {
            "word": "ALLOWANCE",
            "ipa": "/əˈlaʊəns/",
            "type": "noun",
            "meaning": "Sự cho phép",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/all/allow/allowance__us_1.mp3"
      },
      {
            "word": "ALUMINIUM",
            "ipa": "/ˌæləˈmɪniəm/",
            "type": "noun",
            "meaning": "nhôm",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/alu/alumi/aluminium__us_1.mp3"
      },
      {
            "word": "AMBASSADOR",
            "ipa": "/æmˈbæsədər/",
            "type": "noun",
            "meaning": "Đại sứ",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/amb/ambas/ambassador__us_1_rr.mp3"
      },
      {
            "word": "AMENDMENT",
            "ipa": "/əˈmendmənt/",
            "type": "noun",
            "meaning": "Sự cải tà quy chính",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ame/amend/amendment__us_1.mp3"
      },
      {
            "word": "ANONYMOUS",
            "ipa": "/əˈnɑːnɪməs/",
            "type": "adjective",
            "meaning": "Giấu tên",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ano/anony/anonymous__us_1.mp3"
      },
      {
            "word": "APPARATUS",
            "ipa": "/ˌæpəˈrætəs/",
            "type": "noun",
            "meaning": "Đồ thiết bị",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appar/apparatus__us_1_rr.mp3"
      },
      {
            "word": "APPEALING",
            "ipa": "/əˈpiːlɪŋ/",
            "type": "adjective",
            "meaning": "Van lơn, cầu khẩn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appea/appealing__us_1.mp3"
      },
      {
            "word": "APPETITE",
            "ipa": "/ˈæpɪtaɪt/",
            "type": "noun",
            "meaning": "Sự ngon miệng, sự thèm ăn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appet/appetite__us_1.mp3"
      },
      {
            "word": "APPLICABLE",
            "ipa": "/əˈplɪkəbl/",
            "type": "adjective",
            "meaning": "Có thể dùng được, có thể áp dụng được, có thể ứng dụng được",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appli/applicable__us_2_rr.mp3"
      },
      {
            "word": "APPRECIATION",
            "ipa": "/əˌpriːʃiˈeɪʃn/",
            "type": "noun",
            "meaning": "Sự đánh giá",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/app/appre/appreciation__us_1.mp3"
      },
      {
            "word": "ARBITRARY",
            "ipa": "/ˈɑːrbɪtreri/",
            "type": "adjective",
            "meaning": "Chuyên quyền, độc đoán",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/arb/arbit/arbitrary__us_1.mp3"
      },
      {
            "word": "ARCHITECTURAL",
            "ipa": "/ˌɑːrkɪˈtektʃərəl/",
            "type": "adjective",
            "meaning": "Kiến trúc",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/arc/archi/architectural__us_1.mp3"
      },
      {
            "word": "ARGUABLY",
            "ipa": "/ˈɑːrɡjuəbli/",
            "type": "adverb",
            "meaning": "Người ta có thể cho rằng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/arg/argua/arguably__us_1.mp3"
      },
      {
            "word": "ARTICULATE",
            "ipa": "/ɑːrˈtɪkjuleɪt/",
            "type": "verb",
            "meaning": "Nối bằng khớp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/art/artic/articulate__us_1.mp3"
      },
      {
            "word": "ASPIRATION",
            "ipa": "/ˌæspəˈreɪʃn/",
            "type": "noun",
            "meaning": "Nguyện vọng, khát vọng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/asp/aspir/aspiration__us_1.mp3"
      },
      {
            "word": "ASSASSINATION",
            "ipa": "/əˌsæsɪˈneɪʃn/",
            "type": "noun",
            "meaning": "Sự ám sát",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/assas/assassination__us_1.mp3"
      },
      {
            "word": "ASSEMBLE",
            "ipa": "/əˈsembl/",
            "type": "verb",
            "meaning": "Tập hợp, tụ tập, nhóm họp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/assem/assemble__us_1.mp3"
      },
      {
            "word": "ASSEMBLY",
            "ipa": "/əˈsembli/",
            "type": "noun",
            "meaning": "Cuộc họp",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/assem/assembly__us_1.mp3"
      },
      {
            "word": "ASSERTION",
            "ipa": "/əˈsɜːrʃn/",
            "type": "noun",
            "meaning": "Sự đòi (quyền lợi... )",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/asser/assertion__us_1.mp3"
      },
      {
            "word": "ASSURANCE",
            "ipa": "/əˈʃʊrəns/",
            "type": "noun",
            "meaning": "Sự chắc chắn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ass/assur/assurance__us_1.mp3"
      },
      {
            "word": "ATROCITY",
            "ipa": "/əˈtrɑːsəti/",
            "type": "noun",
            "meaning": "Tính hung bạo, sự tàn ác, sự tàn bạo",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/atr/atroc/atrocity__us_1.mp3"
      },
      {
            "word": "ATTENDANCE",
            "ipa": "/əˈtendəns/",
            "type": "noun",
            "meaning": "Sự dự, sự có mặt",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/att/atten/attendance__us_1.mp3"
      },
      {
            "word": "ATTORNEY",
            "ipa": "/əˈtɜːrni/",
            "type": "noun",
            "meaning": "Người được uỷ quyền đại diện trước toà",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/att/attor/attorney__us_1.mp3"
      },
      {
            "word": "ATTRIBUTE",
            "ipa": "/ˈætrɪbjuːt/",
            "type": "noun",
            "meaning": "Thuộc tính",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/att/attri/attribute__us_2.mp3"
      },
      {
            "word": "ATTRIBUTE",
            "ipa": "/əˈtrɪbjuːt/",
            "type": "verb",
            "meaning": "Cho là do, quy cho",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/att/attri/attribute__us_1.mp3"
      },
      {
            "word": "AUTHENTIC",
            "ipa": "/ɔːˈθentɪk/",
            "type": "adjective",
            "meaning": "Đáng tin",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aut/authe/authentic__us_1.mp3"
      },
      {
            "word": "AUTHORIZE",
            "ipa": "/ˈɔːθəraɪz/",
            "type": "verb",
            "meaning": "Cho quyền, uỷ quyền, cho phép",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aut/autho/authorize__us_1.mp3"
      },
      {
            "word": "AUTONOMY",
            "ipa": "/ɔːˈtɑːnəmi/",
            "type": "noun",
            "meaning": "Sự tự trị",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/aut/auton/autonomy__us_1.mp3"
      },
      {
            "word": "AVAILABILITY",
            "ipa": "/əˌveɪləˈbɪləti/",
            "type": "noun",
            "meaning": "Tính sẵn sàng để dùng, tính có thể dùng được",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/a/ava/avail/availability__us_1.mp3"
      },
      {
            "word": "BACKDROP",
            "ipa": "/ˈbækdrɑːp/",
            "type": "noun",
            "meaning": "Tấm màn vẽ căng sau sân khấu",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bac/backd/backdrop__us_1.mp3"
      },
      {
            "word": "BATTLEFIELD",
            "ipa": "/ˈbætlfiːld/",
            "type": "noun",
            "meaning": "Chiến trường",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bat/battl/battlefield__us_1.mp3"
      },
      {
            "word": "BENCHMARK",
            "ipa": "/ˈbentʃmɑːrk/",
            "type": "noun",
            "meaning": "Tiêu chuẩn, cơ chuẩn",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/ben/bench/benchmark__us_1.mp3"
      },
      {
            "word": "BENEFICIARY",
            "ipa": "/ˌbenɪˈfɪʃieri/",
            "type": "noun",
            "meaning": "Người hưởng lợi, người thụ hưởng, người thụ ích",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/ben/benef/beneficiary__us_1_rr.mp3"
      },
      {
            "word": "BIOGRAPHY",
            "ipa": "/baɪˈɑːɡrəfi/",
            "type": "noun",
            "meaning": "Tiểu sử",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bio/biogr/biography__us_1.mp3"
      },
      {
            "word": "BLESSING",
            "ipa": "/ˈblesɪŋ/",
            "type": "noun",
            "meaning": "Phúc lành",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/ble/bless/blessing__us_1.mp3"
      },
      {
            "word": "BOUNDARY",
            "ipa": "/ˈbaʊndri/",
            "type": "noun",
            "meaning": "Đường biên giới, ranh giới",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bou/bound/boundary__us_1.mp3"
      },
      {
            "word": "BREAKDOWN",
            "ipa": "/ˈbreɪkdaʊn/",
            "type": "noun",
            "meaning": "Sự hỏng máy (ô tô, xe lửa)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bre/break/breakdown__us_1.mp3"
      },
      {
            "word": "BREAKTHROUGH",
            "ipa": "/ˈbreɪkθruː/",
            "type": "noun",
            "meaning": "Sự chọc thủng phòng tuyến",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bre/break/breakthrough__us_1.mp3"
      },
      {
            "word": "BROADBAND",
            "ipa": "/ˈbrɔːdbænd/",
            "type": "noun",
            "meaning": "Dải sóng rộng",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bro/broad/broadband__us_1.mp3"
      },
      {
            "word": "BUREAUCRACY",
            "ipa": "/bjʊˈrɑːkrəsi/",
            "type": "noun",
            "meaning": "Quan lại, công chức (nói chung)",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/b/bur/burea/bureaucracy__us_1.mp3"
      },
      {
            "word": "CALCULATION",
            "ipa": "/ˌkælkjuˈleɪʃn/",
            "type": "noun",
            "meaning": "Sự tính, sự tính toán",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/c/cal/calcu/calculation__us_1.mp3"
      },
      {
            "word": "CAPABILITY",
            "ipa": "/ˌkeɪpəˈbɪləti/",
            "type": "noun",
            "meaning": "Khả năng, năng lực",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/c/cap/capab/capability__us_1.mp3"
      },
      {
            "word": "CAPITALISM",
            "ipa": "/ˈkæpɪtəlɪzəm/",
            "type": "noun",
            "meaning": "Chủ nghĩa tư bản",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/c/cap/capit/capitalism__us_1.mp3"
      },
      {
            "word": "CAPITALIST",
            "ipa": "/ˈkæpɪtəlɪst/",
            "type": "adjective",
            "meaning": "Tư bản, tư bản chủ nghĩa",
            "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/c/cap/capit/capitalist__us_1.mp3"
      }
]
  };

  // 4 ĐẠI NGỌC GIẢN TU TIÊN HỌC THUẬT (SPECIALIZED IELTS DECKS)
  const TANG_KINH_DECKS = [
    {
      id: "oxford_5000",
      name: "Cửu Chuyển Hỗn Độn Đan",
      subName: "Kho Oxford • Nhãn CEFR A1–C1 từ dữ liệu nguồn",
      desc: "5,946 từ vựng đại thiên bao la, phân tầng theo 5 đại cảnh giới tu tiên.",
      badge: "TOÀN DIỆN",
      wordsCount: 5946,
      iconType: "scroll",
      color: "#FDE047"
    },
    {
      id: "listening_1200",
      name: "Thính Lôi Trực Điểm",
      subName: "54 từ luyện nghe và chính tả • Bộ tuyển chọn",
      desc: "Chuyên trảm các từ có phụ âm đôi, đuôi -tion, -ment, tên đường, ngày tháng.",
      badge: "LISTENING CHUYÊN SÂU",
      wordsCount: 54,
      iconType: "thunder",
      color: "#38BDF8",
      words: [
      {
            "word": "ACCOMMODATION",
            "ipa": "/əˌkɒm.əˈdeɪ.ʃən/",
            "type": "noun",
            "meaning": "Chỗ ở, phòng trọ, lưu trú"
      },
      {
            "word": "MEDITERRANEAN",
            "ipa": "/ˌmed.ɪ.tərˈeɪ.ni.ən/",
            "type": "adj",
            "meaning": "Địa Trung Hải"
      },
      {
            "word": "CONSCIENTIOUS",
            "ipa": "/ˌkɒn.ʃiˈen.ʃəs/",
            "type": "adj",
            "meaning": "Chu đáo, tận tâm, hết lòng"
      },
      {
            "word": "ENTREPRENEUR",
            "ipa": "/ˌɒn.trə.prəˈnɜːr/",
            "type": "noun",
            "meaning": "Doanh nhân khởi nghiệp"
      },
      {
            "word": "QUESTIONNAIRE",
            "ipa": "/ˌkwes.tʃəˈneər/",
            "type": "noun",
            "meaning": "Bảng câu hỏi khảo sát"
      },
      {
            "word": "MAINTENANCE",
            "ipa": "/ˈmeɪn.tən.əns/",
            "type": "noun",
            "meaning": "Bảo trì, duy tu, bảo dưỡng"
      },
      {
            "word": "ENVIRONMENT",
            "ipa": "/ɪnˈvaɪ.rən.mənt/",
            "type": "noun",
            "meaning": "Môi trường thiên nhiên"
      },
      {
            "word": "GOVERNMENT",
            "ipa": "/ˈɡʌv.ən.mənt/",
            "type": "noun",
            "meaning": "Chính phủ, chính quyền"
      },
      {
            "word": "DISAPPOINTMENT",
            "ipa": "/ˌdɪs.əˈpɔɪnt.mənt/",
            "type": "noun",
            "meaning": "Sự thất vọng, chán nản"
      },
      {
            "word": "OPPORTUNITY",
            "ipa": "/ˌɒp.əˈtʃuː.nə.ti/",
            "type": "noun",
            "meaning": "Cơ hội, thời cơ thuận lợi"
      },
      {
            "word": "PRIVILEGE",
            "ipa": "/ˈprɪv.əl.ɪdʒ/",
            "type": "noun",
            "meaning": "Đặc quyền, đặc ân"
      },
      {
            "word": "OCCASIONALLY",
            "ipa": "/əˈkeɪ.ʒən.əl.i/",
            "type": "adv",
            "meaning": "Thỉnh thoảng, đôi khi"
      },
      {
            "word": "MILLENNIUM",
            "ipa": "/mɪˈlen.i.əm/",
            "type": "noun",
            "meaning": "Thiên niên kỷ (1000 năm)"
      },
      {
            "word": "EMBARRASSMENT",
            "ipa": "/ɪmˈbær.əs.mənt/",
            "type": "noun",
            "meaning": "Sự ngượng ngùng, xấu hổ"
      },
      {
            "word": "COMMITTED",
            "ipa": "/kəˈmɪt.ɪd/",
            "type": "adj",
            "meaning": "Tận tụy, cam kết cống hiến"
      },
      {
            "word": "OCCURRENCE",
            "ipa": "/əˈkʌr.əns/",
            "type": "noun",
            "meaning": "Sự việc xảy ra, biến cố"
      },
      {
            "word": "NECESSARY",
            "ipa": "/ˈnes.ə.ser.i/",
            "type": "adj",
            "meaning": "Cần thiết, thiết yếu"
      },
      {
            "word": "SATELLITE",
            "ipa": "/ˈsæt.əl.aɪt/",
            "type": "noun",
            "meaning": "Vệ tinh nhân tạo"
      },
      {
            "word": "GUARANTEE",
            "ipa": "/ˌɡær.ənˈtiː/",
            "type": "verb",
            "meaning": "Bảo đảm, cam đoan"
      },
      {
            "word": "AGGRESSIVE",
            "ipa": "/əˈɡres.ɪv/",
            "type": "adj",
            "meaning": "Hung hăng, quyết liệt"
      },
      {
            "word": "EXAGGERATE",
            "ipa": "/ɪɡˈzædʒ.ə.reɪt/",
            "type": "verb",
            "meaning": "Phóng đại, thổi phồng"
      },
      {
            "word": "PARALLEL",
            "ipa": "/ˈpær.ə.lel/",
            "type": "adj",
            "meaning": "Song song, tương đồng"
      },
      {
            "word": "TOMORROW",
            "ipa": "/təˈmɒr.əʊ/",
            "type": "noun",
            "meaning": "Ngày mai"
      },
      {
            "word": "PROFESSIONAL",
            "ipa": "/prəˈfeʃ.ən.əl/",
            "type": "adj",
            "meaning": "Chuyên nghiệp, chuyên môn"
      },
      {
            "word": "POSSESS",
            "ipa": "/pəˈzes/",
            "type": "verb",
            "meaning": "Sở hữu, nắm giữ"
      },
      {
            "word": "ASSESSMENT",
            "ipa": "/əˈses.mənt/",
            "type": "noun",
            "meaning": "Sự đánh giá, thẩm định"
      },
      {
            "word": "DISAPPEAR",
            "ipa": "/ˌdɪs.əˈpɪər/",
            "type": "verb",
            "meaning": "Biến mất, tiêu tán"
      },
      {
            "word": "RECOMMEND",
            "ipa": "/ˌrek.əˈmend/",
            "type": "verb",
            "meaning": "Khuyên bảo, đề xuất"
      },
      {
            "word": "INTERRUPTION",
            "ipa": "/ˌɪn.təˈrʌp.ʃən/",
            "type": "noun",
            "meaning": "Sự gián đoạn, ngắt lời"
      },
      {
            "word": "HIERARCHY",
            "ipa": "/ˈhaɪə.rɑː.ki/",
            "type": "noun",
            "meaning": "Hệ thống thứ bậc, đẳng cấp"
      },
      {
            "word": "DISCIPLINE",
            "ipa": "/ˈdɪs.ə.plɪn/",
            "type": "noun",
            "meaning": "Kỷ luật, rèn luyện"
      },
      {
            "word": "CONSCIOUS",
            "ipa": "/ˈkɒn.ʃəs/",
            "type": "adj",
            "meaning": "Có ý thức, nhận thức rõ"
      },
      {
            "word": "FOREIGN",
            "ipa": "/ˈfɒr.ən/",
            "type": "adj",
            "meaning": "Thuộc về nước ngoài, ngoại quốc"
      },
      {
            "word": "MANOEUVRE",
            "ipa": "/məˈnuː.vər/",
            "type": "noun",
            "meaning": "Thao diễn, chuyển động khéo léo"
      },
      {
            "word": "HYGIENE",
            "ipa": "/ˈhaɪ.dʒiːn/",
            "type": "noun",
            "meaning": "Vệ sinh, phòng dịch"
      },
      {
            "word": "ITINERARY",
            "ipa": "/aɪˈtɪn.ər.ər.i/",
            "type": "noun",
            "meaning": "Lịch trình chuyến đi"
      },
      {
            "word": "RESERVATION",
            "ipa": "/ˌrez.əˈveɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự đặt chỗ trước"
      },
      {
            "word": "CERTIFICATE",
            "ipa": "/səˈtɪf.ɪ.kət/",
            "type": "noun",
            "meaning": "Chứng chỉ, văn bằng"
      },
      {
            "word": "VEGETARIAN",
            "ipa": "/ˌvedʒ.ɪˈteə.ri.ən/",
            "type": "noun",
            "meaning": "Người ăn chay"
      },
      {
            "word": "DEPARTURE",
            "ipa": "/dɪˈpɑː.tʃər/",
            "type": "noun",
            "meaning": "Sự khởi hành, rời đi"
      },
      {
            "word": "DESTINATION",
            "ipa": "/ˌdes.tɪˈneɪ.ʃən/",
            "type": "noun",
            "meaning": "Điểm đến mục tiêu"
      },
      {
            "word": "INSURANCE",
            "ipa": "/ɪnˈʃɔː.rəns/",
            "type": "noun",
            "meaning": "Bảo hiểm rủi ro"
      },
      {
            "word": "IDENTIFICATION",
            "ipa": "/aɪˌden.tɪ.fɪˈkeɪ.ʃən/",
            "type": "noun",
            "meaning": "Căn cước, nhận dạng"
      },
      {
            "word": "QUALIFICATION",
            "ipa": "/ˌkwɒl.ɪ.fɪˈkeɪ.ʃən/",
            "type": "noun",
            "meaning": "Bằng cấp, trình độ"
      },
      {
            "word": "MEMBERSHIP",
            "ipa": "/ˈmem.bə.ʃɪp/",
            "type": "noun",
            "meaning": "Tư cách thành viên"
      },
      {
            "word": "CONFIRMATION",
            "ipa": "/ˌkɒn.fəˈmeɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự xác nhận chính thức"
      },
      {
            "word": "APPOINTMENT",
            "ipa": "/əˈpɔɪnt.mənt/",
            "type": "noun",
            "meaning": "Cuộc hẹn đã định"
      },
      {
            "word": "CAFETERIA",
            "ipa": "/ˌkæf.əˈtɪə.ri.ə/",
            "type": "noun",
            "meaning": "Quán ăn tự phục vụ"
      },
      {
            "word": "LABORATORY",
            "ipa": "/ləˈbɒr.ə.tər.i/",
            "type": "noun",
            "meaning": "Phòng thí nghiệm"
      },
      {
            "word": "PHARMACEUTICAL",
            "ipa": "/ˌfɑː.məˈsjuː.tɪ.kəl/",
            "type": "adj",
            "meaning": "Thuộc về dược phẩm"
      },
      {
            "word": "EXHIBITION",
            "ipa": "/ˌek.sɪˈbɪʃ.ən/",
            "type": "noun",
            "meaning": "Cuộc triển lãm trưng bày"
      },
      {
            "word": "TEMPORARY",
            "ipa": "/ˈtem.pər.ər.i/",
            "type": "adj",
            "meaning": "Tạm thời, ngắn hạn"
      },
      {
            "word": "PERMANENT",
            "ipa": "/ˈpɜː.mə.nənt/",
            "type": "adj",
            "meaning": "Lâu dài, vĩnh viễn"
      },
      {
            "word": "RESIDENTIAL",
            "ipa": "/ˌrez.ɪˈden.ʃəl/",
            "type": "adj",
            "meaning": "Khu dân cư sinh sống"
      }
]
    },
    {
      id: "reading_academic",
      name: "Thánh Điển Tàng Thư",
      subName: "43 từ học thuật • Không quy đổi thành điểm IELTS",
      desc: "Thuật ngữ học thuật chuyên sâu về khảo cổ, vũ trụ, sinh thái và công nghệ.",
      badge: "READING HỌC THUẬT",
      wordsCount: 43,
      iconType: "tome",
      color: "#34D399",
      words: [
      {
            "word": "BIODIVERSITY",
            "ipa": "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/",
            "type": "noun",
            "meaning": "Đa dạng sinh học"
      },
      {
            "word": "ARCHAEOLOGICAL",
            "ipa": "/ˌɑː.ki.əˈlɒdʒ.ɪ.kəl/",
            "type": "adj",
            "meaning": "Thuộc về khảo cổ học"
      },
      {
            "word": "STRATIFICATION",
            "ipa": "/ˌstræt.ɪ.fɪˈkeɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự phân tầng địa chất, xã hội"
      },
      {
            "word": "DETERIORATION",
            "ipa": "/dɪˌtɪə.ri.əˈreɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự suy thoái, xuống cấp"
      },
      {
            "word": "INFRASTRUCTURE",
            "ipa": "/ˈɪn.frəˌstrʌk.tʃər/",
            "type": "noun",
            "meaning": "Cơ sở hạ tầng kiến trúc"
      },
      {
            "word": "COUNTERMEASURE",
            "ipa": "/ˈkaʊn.təˌmeʒ.ər/",
            "type": "noun",
            "meaning": "Biện pháp đối phó, hóa giải"
      },
      {
            "word": "SUSTAINABILITY",
            "ipa": "/səˌsteɪ.nəˈbɪl.ə.ti/",
            "type": "noun",
            "meaning": "Tính bền vững lâu dài"
      },
      {
            "word": "PHOTOSYNTHESIS",
            "ipa": "/ˌfəʊ.təʊˈsɪn.θə.sɪs/",
            "type": "noun",
            "meaning": "Quá trình quang hợp thực vật"
      },
      {
            "word": "CHRONOLOGICAL",
            "ipa": "/ˌkrɒn.əˈlɒdʒ.ɪ.kəl/",
            "type": "adj",
            "meaning": "Theo thứ tự thời gian"
      },
      {
            "word": "UNPRECEDENTED",
            "ipa": "/ʌnˈpres.ɪ.den.tɪd/",
            "type": "adj",
            "meaning": "Chưa từng có tiền lệ"
      },
      {
            "word": "DEMOGRAPHIC",
            "ipa": "/ˌdem.əˈɡræf.ɪk/",
            "type": "adj",
            "meaning": "Thuộc về nhân khẩu học"
      },
      {
            "word": "EMPIRICAL",
            "ipa": "/ɪmˈpɪr.ɪ.kəl/",
            "type": "adj",
            "meaning": "Dựa trên thực nghiệm thực tế"
      },
      {
            "word": "PARADIGM",
            "ipa": "/ˈpær.ə.daɪm/",
            "type": "noun",
            "meaning": "Mô hình kiểu mẫu, khuôn khổ"
      },
      {
            "word": "INDIGENOUS",
            "ipa": "/ɪnˈdɪdʒ.ɪ.nəs/",
            "type": "adj",
            "meaning": "Bản địa, thuần bản xứ"
      },
      {
            "word": "DEGRADATION",
            "ipa": "/ˌdeɡ.rəˈdeɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự thoái hóa, suy tàn"
      },
      {
            "word": "COGNITIVE",
            "ipa": "/ˈkɒɡ.nə.tɪv/",
            "type": "adj",
            "meaning": "Thuộc về nhận thức tư duy"
      },
      {
            "word": "PHENOMENON",
            "ipa": "/fəˈnɒm.ɪ.nən/",
            "type": "noun",
            "meaning": "Hiện tượng dị thường, kỳ thú"
      },
      {
            "word": "CORRELATION",
            "ipa": "/ˌkɒr.əˈleɪ.ʃən/",
            "type": "noun",
            "meaning": "Mối tương quan tương hỗ"
      },
      {
            "word": "HYPOTHESIS",
            "ipa": "/haɪˈpɒθ.ə.sɪs/",
            "type": "noun",
            "meaning": "Giả thuyết khoa học"
      },
      {
            "word": "SYNTHESIZE",
            "ipa": "/ˈsɪn.θə.saɪz/",
            "type": "verb",
            "meaning": "Tổng hợp, đúc kết tinh hoa"
      },
      {
            "word": "SUBSTANTIATE",
            "ipa": "/səbˈstæn.ʃi.eɪt/",
            "type": "verb",
            "meaning": "Chứng minh xác thực, làm sáng tỏ"
      },
      {
            "word": "PRELIMINARY",
            "ipa": "/prɪˈlɪm.ɪ.nər.i/",
            "type": "adj",
            "meaning": "Sơ bộ, mở đầu, ban đầu"
      },
      {
            "word": "VULNERABILITY",
            "ipa": "/ˌvʌl.nər.əˈbɪl.ə.ti/",
            "type": "noun",
            "meaning": "Tính dễ bị tổn thương, yếu điểm"
      },
      {
            "word": "PREDOMINANTLY",
            "ipa": "/prɪˈdɒm.ɪ.nənt.li/",
            "type": "adv",
            "meaning": "Chủ yếu, phần lớn chiếm ưu thế"
      },
      {
            "word": "MANIFESTATION",
            "ipa": "/ˌmæn.ɪ.feˈsteɪ.ʃən/",
            "type": "noun",
            "meaning": "Biểu hiện rõ rệt, hiển lộ"
      },
      {
            "word": "EQUILIBRIUM",
            "ipa": "/ˌek.wɪˈlɪb.ri.əm/",
            "type": "noun",
            "meaning": "Trạng thái cân bằng hài hòa"
      },
      {
            "word": "INTERMITTENT",
            "ipa": "/ˌɪn.təˈmɪt.ənt/",
            "type": "adj",
            "meaning": "Không liên tục, ngắt quãng"
      },
      {
            "word": "DISPROPORTIONATE",
            "ipa": "/ˌdɪs.prəˈpɔː.ʃən.ət/",
            "type": "adj",
            "meaning": "Không tương xứng, mất cân đối"
      },
      {
            "word": "DISSEMINATION",
            "ipa": "/dɪˌsem.ɪˈneɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự phổ biến lan truyền rộng rãi"
      },
      {
            "word": "PLAUSIBLE",
            "ipa": "/ˈplɔː.zə.bəl/",
            "type": "adj",
            "meaning": "Hợp lý, đáng tin cậy"
      },
      {
            "word": "ANOMALY",
            "ipa": "/əˈnɒm.ə.li/",
            "type": "noun",
            "meaning": "Sự bất thường, dị thường"
      },
      {
            "word": "SCRUTINIZE",
            "ipa": "/ˈskruː.tɪ.naɪz/",
            "type": "verb",
            "meaning": "Xem xét kỹ lưỡng, tra cứu sâu"
      },
      {
            "word": "OBSOLETE",
            "ipa": "/ˌɒb.səˈliːt/",
            "type": "adj",
            "meaning": "Lỗi thời, không còn thịnh hành"
      },
      {
            "word": "PERVASIVE",
            "ipa": "/pəˈveɪ.sɪv/",
            "type": "adj",
            "meaning": "Lan tỏa khắp nơi, phổ quát"
      },
      {
            "word": "RIGOROUS",
            "ipa": "/ˈrɪɡ.ər.əs/",
            "type": "adj",
            "meaning": "Nghiêm ngặt, khắt khe, chặt chẽ"
      },
      {
            "word": "UBIQUITOUS",
            "ipa": "/juːˈbɪk.wɪ.təs/",
            "type": "adj",
            "meaning": "Phổ biến mọi nơi, đâu đâu cũng thấy"
      },
      {
            "word": "AUTONOMOUS",
            "ipa": "/ɔːˈtɒn.ə.məs/",
            "type": "adj",
            "meaning": "Tự chủ, độc lập tự vận hành"
      },
      {
            "word": "METAMORPHOSIS",
            "ipa": "/ˌmet.əˈmɔː.fə.sɪs/",
            "type": "noun",
            "meaning": "Sự biến thái, lột xác hoàn toàn"
      },
      {
            "word": "TRANSCENDENTAL",
            "ipa": "/ˌtræn.senˈden.təl/",
            "type": "adj",
            "meaning": "Siêu việt, vượt tầm vũ trụ"
      },
      {
            "word": "CONSEQUENTIALLY",
            "ipa": "/ˌkɒn.sɪˈkwen.ʃəl.i/",
            "type": "adv",
            "meaning": "Do đó, hậu quả kéo theo"
      },
      {
            "word": "INEVITABILITY",
            "ipa": "/ɪnˌev.ɪ.təˈbɪl.ə.ti/",
            "type": "noun",
            "meaning": "Tính tất yếu không thể tránh khỏi"
      },
      {
            "word": "JUXTAPOSITION",
            "ipa": "/ˌdʒʌk.stə.pəˈzɪʃ.ən/",
            "type": "noun",
            "meaning": "Sự đặt cạnh nhau đối chiếu"
      },
      {
            "word": "REVERBERATION",
            "ipa": "/rɪˌvɜː.bərˈeɪ.ʃən/",
            "type": "noun",
            "meaning": "Sự dội lại, tác động sâu xa"
      }
]
    },
    {
      id: "flashcard_srs",
      name: "Bản Mệnh Linh Từ",
      subName: "Từ yếu và lịch ôn trên thiết bị này",
      desc: "Trảm lại những từ từng bị Tâm Ma quấy nhiễu (gõ sai trong các trận trước).",
      badge: "ÔN TẬP SRS",
      wordsCount: 0,
      iconType: "catPaw",
      color: "#F43F5E",
      words: [
        { "word": "PERSEVERE", "ipa": "/ˌpɜː.sɪˈvɪər/", "type": "verb", "meaning": "Kiên trì bền bỉ vượt nghịch cảnh" },
        { "word": "RESILIENT", "ipa": "/rɪˈzɪl.jənt/", "type": "adj", "meaning": "Kiên cường dẻo dai trước thử thách" },
        { "word": "TRANSCEND", "ipa": "/trænˈsend/", "type": "verb", "meaning": "Vượt qua giới hạn, phi thăng" }
      ]
    }
  ];

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.REALM_DECKS = REALM_DECKS;
  root.Meowcha.TANG_KINH_DECKS = TANG_KINH_DECKS;
})(typeof window !== 'undefined' ? window : globalThis);
