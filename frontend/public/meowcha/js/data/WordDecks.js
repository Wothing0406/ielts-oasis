/**
 * WordDecks.js - Kho Từ Vựng IELTS Tiên Đạo 5 Cảnh Giới
 * Phân chia theo chuẩn IELTS từ 4.0 đến 9.0 Master, kèm phiên âm chuẩn IPA
 */
(function(root) {
  const REALM_DECKS = {
    0: [ // CẢNH 1: LUYỆN KHÍ KỲ • BĂNG PHÁCH MA THẠCH (IELTS 4.0 - 5.0)
      { word: "ALERT", ipa: "/əˈlɜːt/", type: "adj", meaning: "Cảnh giác, tỉnh táo, lanh lẹ" },
      { word: "SWIFT", ipa: "/swɪft/", type: "adj", meaning: "Mau lẹ, nhanh như chớp" },
      { word: "FOCUS", ipa: "/ˈfəʊ.kəs/", type: "verb", meaning: "Tập trung tinh thần, định tâm" },
      { word: "CLIMB", ipa: "/klaɪm/", type: "verb", meaning: "Leo trèo, thăng tiến tu vi" },
      { word: "BRAVE", ipa: "/breɪv/", type: "adj", meaning: "Dũng cảm, can trường bất khuất" },
      { word: "VIGOR", ipa: "/ˈvɪɡ.ər/", type: "noun", meaning: "Nguyên khí dồi dào, sinh lực" },
      { word: "CLEAR", ipa: "/klɪər/", type: "adj", meaning: "Trong sáng, minh triết, rõ ràng" },
      { word: "LUCID", ipa: "/ˈluː.sɪd/", type: "adj", meaning: "Minh bạch, sáng suốt, tỉnh táo" },
      { word: "PATIENT", ipa: "/ˈpeɪ.ʃənt/", type: "adj", meaning: "Kiên nhẫn, nhẫn nại tĩnh tâm" },
      { word: "BALANCE", ipa: "/ˈbæl.əns/", type: "noun", meaning: "Cân bằng âm dương, điều hòa" },
      { word: "JOURNEY", ipa: "/ˈdʒɜː.ni/", type: "noun", meaning: "Hành trình tu tiên cầu đạo" },
      { word: "HARVEST", ipa: "/ˈhɑː.vɪst/", type: "verb", meaning: "Thu hoạch đạo quả, kết tinh" },
      { word: "MEDITATE", ipa: "/ˈmed.ɪ.teɪt/", type: "verb", meaning: "Thiền định, ngưng thần dưỡng khí" },
      { word: "PURIFY", ipa: "/ˈpjʊə.rɪ.faɪ/", type: "verb", meaning: "Thanh tẩy tâm hồn, tẩy trần" }
    ],
    1: [ // CẢNH 2: TRÚC CƠ KỲ • HỎA DIỄM MA THẠCH (IELTS 6.0 - 6.5)
      { word: "NURTURE", ipa: "/ˈnɜː.tʃər/", type: "verb", meaning: "Bồi dưỡng, nuôi nấng đạo hạnh" },
      { word: "ASPIRE", ipa: "/əˈspaɪər/", type: "verb", meaning: "Khao khát, hướng tới cảnh giới cao" },
      { word: "THRIVE", ipa: "/θraɪv/", type: "verb", meaning: "Phát triển mạnh mẽ, hưng thịnh" },
      { word: "ENDURE", ipa: "/ɪnˈdʒʊər/", type: "verb", meaning: "Kiên trì chịu đựng, nhẫn nại" },
      { word: "EXPAND", ipa: "/ɪkˈspænd/", type: "verb", meaning: "Khai mở, mở rộng đan điền" },
      { word: "ZEALOUS", ipa: "/ˈzel.əs/", type: "adj", meaning: "Hăng hái, nhiệt huyết, tận tụy" },
      { word: "ASCEND", ipa: "/əˈsend/", type: "verb", meaning: "Thăng hoa, phi thăng, vượt lên" },
      { word: "PURSUIT", ipa: "/pəˈsjuːt/", type: "noun", meaning: "Sự truy cầu, theo đuổi đại đạo" },
      { word: "DILIGENCE", ipa: "/ˈdɪl.ɪ.dʒəns/", type: "noun", meaning: "Cần cù, chăm chỉ khổ luyện" },
      { word: "DISCIPLINE", ipa: "/ˈdɪs.ə.plɪn/", type: "noun", meaning: "Kỷ luật thép, tông môn quy củ" },
      { word: "PERSEVERE", ipa: "/ˌpɜː.sɪˈvɪər/", type: "verb", meaning: "Kiên định bất khuất đến cùng" },
      { word: "FORTITUDE", ipa: "/ˈfɔː.tɪ.tʃuːd/", type: "noun", meaning: "Sức chịu đựng ngoan cường" },
      { word: "CULTIVATE", ipa: "/ˈkʌl.tɪ.veɪt/", type: "verb", meaning: "Tu luyện chân nguyên, tích lũy" },
      { word: "ASPIRATION", ipa: "/ˌæs.pɪˈreɪ.ʃən/", type: "noun", meaning: "Chí hướng cao xa, hoài bão" }
    ],
    2: [ // CẢNH 3: KIM ĐAN KỲ • HƯ KHÔNG MA THẠCH (IELTS 7.0 - 7.5)
      { word: "RESILIENT", ipa: "/rɪˈzɪl.jənt/", type: "adj", meaning: "Kiên cường, dẻo dai, bất khuất" },
      { word: "LUMINOUS", ipa: "/ˈluː.mɪ.nəs/", type: "adj", meaning: "Rực rỡ, phát quang sáng chói" },
      { word: "PROFOUND", ipa: "/prəˈfaʊnd/", type: "adj", meaning: "Uyên thâm, thâm sâu vô lượng" },
      { word: "SERENITY", ipa: "/səˈren.ə.ti/", type: "noun", meaning: "Sự thanh thản, an tĩnh tuyệt đối" },
      { word: "TENACITY", ipa: "/təˈnæs.ə.ti/", type: "noun", meaning: "Sự bền bỉ, kiên trì phi thường" },
      { word: "MAGNITUDE", ipa: "/ˈmæɡ.nɪ.tjuːd/", type: "noun", meaning: "Tầm vóc vĩ đại, quy mô to lớn" },
      { word: "PERSEVERANCE", ipa: "/ˌpɜː.sɪˈvɪə.rəns/", type: "noun", meaning: "Sự kiên trì bền gan vững chí" },
      { word: "COMPREHENSIVE", ipa: "/ˌkɒm.prɪˈhen.sɪv/", type: "adj", meaning: "Toàn diện, bao quát đại thiên" },
      { word: "TRANSFORMATION", ipa: "/ˌtræns.fəˈmeɪ.ʃən/", type: "noun", meaning: "Sự lột xác biến hóa thăng hoa" },
      { word: "EXTRAORDINARY", ipa: "/ɪkˈstrɔː.dɪn.ər.i/", type: "adj", meaning: "Phi thường, xuất chúng dị thường" },
      { word: "SOPHISTICATED", ipa: "/səˈfɪs.tɪ.keɪ.tɪd/", type: "adj", meaning: "Tinh tế uyên bác, phức hợp" },
      { word: "SIMULTANEOUS", ipa: "/ˌsɪm.əlˈteɪ.ni.əs/", type: "adj", meaning: "Đồng thời, vạn biến song hành" }
    ],
    3: [ // CẢNH 4: NGUYÊN ANH KỲ • HUYẾT LÔI MA THẠCH (IELTS 8.0+)
      { word: "OMNIPOTENT", ipa: "/ɒmˈnɪp.ə.tənt/", type: "adj", meaning: "Toàn năng, uy lực vô biên" },
      { word: "SOVEREIGN", ipa: "/ˈsɒv.rɪn/", type: "noun", meaning: "Bậc chí tôn, đế vương thống trị" },
      { word: "CELESTIAL", ipa: "/səˈles.ti.əl/", type: "adj", meaning: "Thuộc về cõi tiên, thiên giới" },
      { word: "TRANSCEND", ipa: "/trænˈsend/", type: "verb", meaning: "Siêu việt, vượt qua mọi giới hạn" },
      { word: "FORMIDABLE", ipa: "/fɔːˈmɪd.ə.bəl/", type: "adj", meaning: "Ghê gớm, uy mãnh khiến nể phục" },
      { word: "INVINCIBLE", ipa: "/ɪnˈvɪn.sə.bəl/", type: "adj", meaning: "Bất khả chiến bại, vô địch" },
      { word: "UNPRECEDENTED", ipa: "/ʌnˈpres.ɪ.den.tɪd/", type: "adj", meaning: "Chưa từng có tiền lệ trong lịch sử" },
      { word: "INSURMOUNTABLE", ipa: "/ˌɪn.səˈmaʊn.tə.bəl/", type: "adj", meaning: "Không thể vượt qua, sừng sững" },
      { word: "DISPROPORTIONATE", ipa: "/ˌdɪs.prəˈpɔː.ʃən.ət/", type: "adj", meaning: "Áp đảo vượt bậc, siêu cân xứng" },
      { word: "INCOMPREHENSIBLE", ipa: "/ɪnˌkɒm.prɪˈhen.sə.bəl/", type: "adj", meaning: "Khôn xiết thấu hiểu, huyền bí" },
      { word: "UNCOMPROMISING", ipa: "/ʌnˈkɒm.prə.maɪ.zɪŋ/", type: "adj", meaning: "Không thỏa hiệp, kiên quyết sắt đá" },
      { word: "REVOLUTIONARY", ipa: "/ˌrev.əˈluː.ʃən.ər.i/", type: "adj", meaning: "Mang tính cách mạng đột phá" }
    ],
    4: [ // CẢNH 5: THÁI THƯỢNG ĐẾ TÔN • THÁI SƠ HỖN ĐỘN THẠCH (IELTS 8.5 - 9.0 MASTER)
      { word: "QUINTESSENCE", ipa: "/kwɪnˈtes.əns/", type: "noun", meaning: "Tinh hoa đệ nhất, linh hồn thuần khiết" },
      { word: "INEFFABLE", ipa: "/ɪnˈef.ə.bəl/", type: "adj", meaning: "Huyền diệu khôn tả, vi diệu khôn cùng" },
      { word: "UBIQUITOUS", ipa: "/juːˈbɪk.wɪ.təs/", type: "adj", meaning: "Phổ biến khắp nơi, vô sở bất tại" },
      { word: "PERSPICACITY", ipa: "/ˌpɜː.spɪˈkæs.ə.ti/", type: "noun", meaning: "Tuệ nhãn thông suốt, sự sắc sảo thần kỳ" },
      { word: "MAGNANIMOUS", ipa: "/mæɡˈnæn.ɪ.məs/", type: "adj", meaning: "Hào hiệp độ lượng, tâm hoài thiên hạ" },
      { word: "EQUANIMITY", ipa: "/ˌek.wəˈnɪm.ə.ti/", type: "noun", meaning: "Tâm thái bình thản trước vạn biến" },
      { word: "SERENDIPITY", ipa: "/ˌser.ənˈdɪp.ə.ti/", type: "noun", meaning: "Tiên duyên kỳ ngộ, may mắn bất ngờ" },
      { word: "INCOMMUNICABLE", ipa: "/ˌɪn.kəˈmjuː.nɪ.kə.bəl/", type: "adj", meaning: "Huyền diệu không lời nào tả xiết" },
      { word: "CIRCUMSPECTION", ipa: "/ˌsɜː.kəmˈspek.ʃən/", type: "noun", meaning: "Sự cẩn trọng chu toàn vạn sự" },
      { word: "INEXHAUSTIBLE", ipa: "/ˌɪn.ɪɡˈzɔː.stə.bəl/", type: "adj", meaning: "Vô cùng vô tận, bất tận trường tồn" },
      { word: "METAMORPHOSIS", ipa: "/ˌmet.əˈmɔː.fə.sɪs/", type: "noun", meaning: "Hóa thân niết bàn, biến đổi vi diệu" },
      { word: "TRANSCENDENTAL", ipa: "/ˌtræn.senˈden.təl/", type: "adj", meaning: "Siêu nhiên tuyệt đối, vượt vũ trụ" }
    ]
  };

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.REALM_DECKS = REALM_DECKS;
})(typeof window !== 'undefined' ? window : globalThis);
