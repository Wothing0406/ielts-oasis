using System;
using System.Collections.Generic;

namespace Meowcha.Data
{
    [Serializable]
    public enum CultivationRealm
    {
        LuyenKhi = 0,     // Luyện Khí Kỳ (Kiếm Đồng)
        TrucCo = 1,       // Trúc Cơ Kỳ (Kiếm Tu)
        KimDan = 2,       // Kim Đan Kỳ (Kiếm Sư)
        NguyenAnh = 3,    // Nguyên Anh Kỳ (Kiếm Tông)
        ThaiThuong = 4    // Thái Thượng Miêu Tôn (Kiếm Thần)
    }

    [Serializable]
    public enum AsteroidElement
    {
        Inferno,      // Hỏa Diễm
        Frost,        // Băng Phách
        Void,         // Hư Không
        BloodThunder  // Huyết Lôi
    }

    [Serializable]
    public class VocabItem
    {
        public int id;
        public string word;
        public string ipa;
        public string type;
        public string meaning;
        public int band_level;
        public string asteroid_type;
        public float difficulty_score;
    }

    [Serializable]
    public class LeaderboardEntry
    {
        public int id;
        public int rank;
        public string player_name;
        public int score;
        public int words_slain;
        public string realm;
        public float accuracy;
        public int wpm;
        public string created_at;
    }

    [Serializable]
    public class SaveSlotData
    {
        public int slot_id;
        public string slot_name;
        public bool is_occupied;
        public string realm;
        public int realm_idx;
        public string title;
        public int hp;
        public int max_hp;
        public int score;
        public int words_slain;
        public int band_idx;
        public string updated_at;
    }

    [Serializable]
    public class ScoreSubmissionRequest
    {
        public string player_name;
        public int score;
        public int words_slain;
        public string realm;
        public float accuracy;
        public int wpm;
    }

    [Serializable]
    public class ApiResponse<T>
    {
        public bool success;
        public T data;
        public string message;
    }
}
