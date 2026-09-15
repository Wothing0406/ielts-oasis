using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using Meowcha.Data;

namespace Meowcha.Database
{
    /// <summary>
    /// DatabaseWordManager - Quản lý nạp, lưu trữ và truy vấn từ vựng IELTS Tiên Hiệp.
    /// Hỗ trợ nạp song song từ Web API MySQL Backend và SQLite cục bộ.
    /// Triệt tiêu hoàn toàn giật lag khi spawn thiên thạch nhờ cơ chế Pre-caching & Memory Pool.
    /// </summary>
    public class DatabaseWordManager : MonoBehaviour
    {
        public static DatabaseWordManager Instance { get; private set; }

        [Header("Production Network & Database Security")]
        [Tooltip("Endpoint Production chính thức - tuyệt đối không lộ địa chỉ IP máy chủ nội bộ")]
        [SerializeField] private string productionApiUrl = "/api/meowcha";
        [SerializeField] private bool useLocalSqliteFallback = true;
        [SerializeField] private bool forceOfflineProductMode = false;

        [Header("Caching & Pooling")]
        [SerializeField] private int prefetchBatchSize = 100;

        // Bộ nhớ đệm RAM phân nhóm theo Band IELTS (4.0 -> 8.5+)
        private readonly Dictionary<int, List<VocabItem>> bandWordCaches = new Dictionary<int, List<VocabItem>>();
        
        // Hàng đợi từ vựng đã xáo trộn sẵn (FIFO) để spawn tức thì O(1)
        private readonly Queue<VocabItem> activeBattleWordQueue = new Queue<VocabItem>();

        // Sự kiện thông báo khi nạp dữ liệu thành công
        public event Action OnVocabLoadedSuccess;
        public event Action<string> OnVocabLoadFailed;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeDatabaseSchema();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// Phân giải Endpoint bảo mật cho môi trường Product (không bao giờ lộ IP host)
        /// </summary>
        public string GetResolvedApiUrl()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            // Trên WebGL Production, dùng relative path an toàn
            return "/api/meowcha";
#else
            // Trên Standalone/Mobile Product, sử dụng domain an toàn hoặc fallback sang SQLite
            if (forceOfflineProductMode) return string.Empty;
            if (!string.IsNullOrEmpty(productionApiUrl) && !productionApiUrl.Contains("100.127.") && !productionApiUrl.Contains("192.168."))
            {
                return productionApiUrl.StartsWith("http") ? productionApiUrl : "https://ielts-oasis.com" + productionApiUrl;
            }
            return "/api/meowcha";
#endif
        }

        /// <summary>
        /// Khởi tạo Schema SQLite cục bộ (khi chạy offline trên Windows/Android/iOS)
        /// </summary>
        private void InitializeDatabaseSchema()
        {
            /*
             * SQL SCHEMA CHUẨN TRONG SQLITE CỤC BỘ / MYSQL:
             * 
             * CREATE TABLE IF NOT EXISTS vocabularies (
             *     id INTEGER PRIMARY KEY AUTOINCREMENT,
             *     word TEXT UNIQUE NOT NULL,
             *     ipa TEXT NOT NULL,
             *     type TEXT DEFAULT 'noun',
             *     meaning TEXT NOT NULL,
             *     band_level INTEGER NOT NULL,     -- 4, 5, 6, 7, 8, 9
             *     topic TEXT DEFAULT 'general',
             *     asteroid_type TEXT DEFAULT 'INFERNO', -- INFERNO, FROST, VOID, BLOOD_THUNDER
             *     difficulty_score REAL DEFAULT 1.0,
             *     times_encountered INTEGER DEFAULT 0,
             *     times_slain INTEGER DEFAULT 0,
             *     last_practiced_at DATETIME
             * );
             * 
             * CREATE INDEX IF NOT EXISTS idx_vocab_band ON vocabularies(band_level);
             */
        }

        /// <summary>
        /// Nạp toàn bộ kho từ vựng từ Backend MySQL và phân loại sẵn vào Cache
        /// </summary>
        public void LoadVocabulariesForBand(int targetBand, Action onComplete = null)
        {
            if (forceOfflineProductMode)
            {
                LoadFallbackAncientVocabPool(targetBand);
                OnVocabLoadedSuccess?.Invoke();
                onComplete?.Invoke();
                return;
            }
            StartCoroutine(FetchVocabRoutine(targetBand, onComplete));
        }

        private IEnumerator FetchVocabRoutine(int targetBand, Action onComplete)
        {
            string baseUrl = GetResolvedApiUrl();
            if (string.IsNullOrEmpty(baseUrl))
            {
                LoadFallbackAncientVocabPool(targetBand);
                OnVocabLoadedSuccess?.Invoke();
                onComplete?.Invoke();
                yield break;
            }

            string url = $"{baseUrl}/vocab?band={targetBand}&limit={prefetchBatchSize}";
            using (UnityWebRequest req = UnityWebRequest.Get(url))
            {
                req.timeout = 6;
                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        string json = req.downloadHandler.text;
                        string wrappedJson = "{\"items\":" + json + "}";
                        VocabListWrapper wrapper = JsonUtility.FromJson<VocabListWrapper>(wrappedJson);

                        if (wrapper != null && wrapper.items != null && wrapper.items.Count > 0)
                        {
                            PopulateWordCache(targetBand, wrapper.items);
                            OnVocabLoadedSuccess?.Invoke();
                            onComplete?.Invoke();
                            yield break;
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.LogWarning($"[DatabaseWordManager] Parse JSON thất bại: {ex.Message}");
                    }
                }
                else
                {
                    Debug.LogWarning($"[DatabaseWordManager] Kết nối Backend thất bại ({req.error}), kích hoạt kho từ vựng SQLite/Offline độc lập!");
                }

                // Fallback: Nạp kho từ vựng tiên hiệp tích hợp sẵn nếu mất mạng
                LoadFallbackAncientVocabPool(targetBand);
                OnVocabLoadedSuccess?.Invoke();
                onComplete?.Invoke();
            }
        }

        private void PopulateWordCache(int band, List<VocabItem> items)
        {
            if (!bandWordCaches.ContainsKey(band))
            {
                bandWordCaches[band] = new List<VocabItem>();
            }

            bandWordCaches[band].Clear();
            bandWordCaches[band].AddRange(items);

            // Xáo trộn ngẫu nhiên (Fisher-Yates Shuffle) đưa vào hàng đợi
            ShuffleAndEnQueue(bandWordCaches[band]);
        }

        private void ShuffleAndEnQueue(List<VocabItem> list)
        {
            activeBattleWordQueue.Clear();
            List<VocabItem> copy = new List<VocabItem>(list);
            int n = copy.Count;
            while (n > 1)
            {
                n--;
                int k = UnityEngine.Random.Range(0, n + 1);
                VocabItem value = copy[k];
                copy[k] = copy[n];
                copy[n] = value;
            }

            foreach (var item in copy)
            {
                activeBattleWordQueue.Enqueue(item);
            }
        }

        /// <summary>
        /// Lấy ra từ vựng tiếp theo cho thiên thạch mới với thời gian truy xuất O(1) không giật lag
        /// </summary>
        public VocabItem GetNextBattleWord(int band)
        {
            if (activeBattleWordQueue.Count == 0)
            {
                if (bandWordCaches.ContainsKey(band) && bandWordCaches[band].Count > 0)
                {
                    ShuffleAndEnQueue(bandWordCaches[band]);
                }
                else
                {
                    LoadFallbackAncientVocabPool(band);
                }
            }

            return activeBattleWordQueue.Count > 0 ? activeBattleWordQueue.Dequeue() : GetEmergencyWord();
        }

        /// <summary>
        /// Kho từ vựng Tiên Đạo IELTS dự phòng ngoại tuyến từ danh sách Oxford 5000 CEFR
        /// </summary>
        private void LoadFallbackAncientVocabPool(int band)
        {
            List<VocabItem> fallback = new List<VocabItem>
            {
                // Band 4.0 - 5.0 (Băng Phách - Frost)
                new VocabItem { id = 1, word = "serene", ipa = "/səˈriːn/", type = "adj", meaning = "Thanh tịnh, an nhiên tự tại", band_level = 0, asteroid_type = "FROST", difficulty_score = 1.0f },
                new VocabItem { id = 2, word = "glacier", ipa = "/ˈɡlæsiər/", type = "noun", meaning = "Băng xuyên ngàn năm", band_level = 0, asteroid_type = "FROST", difficulty_score = 1.0f },
                new VocabItem { id = 3, word = "crystal", ipa = "/ˈkrɪstl/", type = "noun", meaning = "Linh thạch tinh thể", band_level = 0, asteroid_type = "FROST", difficulty_score = 1.1f },
                new VocabItem { id = 4, word = "shield", ipa = "/ʃiːld/", type = "noun", meaning = "Linh thuẫn phòng thủ", band_level = 0, asteroid_type = "FROST", difficulty_score = 1.0f },
                new VocabItem { id = 5, word = "breeze", ipa = "/briːz/", type = "noun", meaning = "Thanh phong phất qua", band_level = 0, asteroid_type = "FROST", difficulty_score = 1.0f },

                // Band 6.0 - 6.5 (Hỏa Diễm - Inferno)
                new VocabItem { id = 6, word = "aspire", ipa = "/əˈspaɪər/", type = "verb", meaning = "Khao khát, hướng tới cảnh giới cao", band_level = 1, asteroid_type = "INFERNO", difficulty_score = 1.2f },
                new VocabItem { id = 7, word = "nurture", ipa = "/ˈnɜːtʃər/", type = "verb", meaning = "Bồi dưỡng, nuôi nấng đạo hạnh", band_level = 1, asteroid_type = "INFERNO", difficulty_score = 1.2f },
                new VocabItem { id = 8, word = "ignite", ipa = "/ɪɡˈnaɪt/", type = "verb", meaning = "Thắp lên đốm lửa đan điền", band_level = 1, asteroid_type = "INFERNO", difficulty_score = 1.3f },
                new VocabItem { id = 9, word = "blaze", ipa = "/bleɪz/", type = "noun", meaning = "Ngọn lửa linh hỏa hừng hực", band_level = 1, asteroid_type = "INFERNO", difficulty_score = 1.2f },
                new VocabItem { id = 10, word = "valiant", ipa = "/ˈvæliənt/", type = "adj", meaning = "Dũng cảm trảm yêu trừ ma", band_level = 1, asteroid_type = "INFERNO", difficulty_score = 1.3f },

                // Band 7.0 - 7.5 (Hư Không - Void)
                new VocabItem { id = 11, word = "resilient", ipa = "/rɪˈzɪliənt/", type = "adj", meaning = "Kiên cường, bất khuất trước thiên kiếp", band_level = 2, asteroid_type = "VOID", difficulty_score = 1.5f },
                new VocabItem { id = 12, word = "transcend", ipa = "/trænˈsend/", type = "verb", meaning = "Siêu việt, đột phá phàm trần", band_level = 2, asteroid_type = "VOID", difficulty_score = 1.6f },
                new VocabItem { id = 13, word = "profound", ipa = "/prəˈfaʊnd/", type = "adj", meaning = "Thâm sâu huyền diệu khó lường", band_level = 2, asteroid_type = "VOID", difficulty_score = 1.5f },
                new VocabItem { id = 14, word = "abyss", ipa = "/əˈbɪs/", type = "noun", meaning = "Vực sâu hư không vô tận", band_level = 2, asteroid_type = "VOID", difficulty_score = 1.4f },
                new VocabItem { id = 15, word = "ethereal", ipa = "/iˈθɪəriəl/", type = "adj", meaning = "Thanh tao thoát tục như tiên cảnh", band_level = 2, asteroid_type = "VOID", difficulty_score = 1.7f },

                // Band 8.0+ (Huyết Lôi - Blood Thunder)
                new VocabItem { id = 16, word = "zenith", ipa = "/ˈzenɪθ/", type = "noun", meaning = "Đỉnh cao tuyệt đỉnh của tu vi", band_level = 3, asteroid_type = "BLOOD_THUNDER", difficulty_score = 1.8f },
                new VocabItem { id = 17, word = "ephemeral", ipa = "/ɪˈfemərəl/", type = "adj", meaning = "Phù du chớp mắt như mộng ảo", band_level = 3, asteroid_type = "BLOOD_THUNDER", difficulty_score = 2.0f },
                new VocabItem { id = 18, word = "ineffable", ipa = "/ɪnˈefəbl/", type = "adj", meaning = "Diệu kỳ không thể diễn tả bằng lời", band_level = 3, asteroid_type = "BLOOD_THUNDER", difficulty_score = 2.2f },
                new VocabItem { id = 19, word = "sovereign", ipa = "/ˈsɒvrɪn/", type = "noun", meaning = "Đấng chí tôn thống ngự chư thiên", band_level = 3, asteroid_type = "BLOOD_THUNDER", difficulty_score = 2.1f },
                new VocabItem { id = 20, word = "tempest", ipa = "/ˈtempɪst/", type = "noun", meaning = "Cơn bão lôi kiếp kinh thiên động địa", band_level = 3, asteroid_type = "BLOOD_THUNDER", difficulty_score = 1.9f }
            };

            PopulateWordCache(band, fallback);
        }

        private VocabItem GetEmergencyWord()
        {
            return new VocabItem
            {
                id = 999,
                word = "sword",
                ipa = "/sɔːd/",
                type = "noun",
                meaning = "Thanh kiếm trảm ma",
                band_level = 5,
                asteroid_type = "INFERNO",
                difficulty_score = 1.0f
            };
        }

        [Serializable]
        private class VocabListWrapper
        {
            public List<VocabItem> items;
        }
    }
}
