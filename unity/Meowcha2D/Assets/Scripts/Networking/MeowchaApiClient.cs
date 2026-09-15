using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Meowcha.Data;

namespace Meowcha.Networking
{
    public class MeowchaApiClient : MonoBehaviour
    {
        public static MeowchaApiClient Instance { get; private set; }

        [Header("Backend API Endpoint")]
        [SerializeField] private string baseUrl = "http://100.127.204.9:8000/api/meowcha";

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// Lấy danh sách từ vựng IELTS theo Band từ MySQL
        /// </summary>
        public void FetchVocabulary(int band, Action<List<VocabItem>> onSuccess, Action<string> onError)
        {
            StartCoroutine(GetRequest($"{baseUrl}/vocab?band={band}&limit=50", (json) =>
            {
                try
                {
                    // Unity JsonUtility wrapper
                    string wrappedJson = "{\"items\":" + json + "}";
                    VocabListWrapper wrapper = JsonUtility.FromJson<VocabListWrapper>(wrappedJson);
                    onSuccess?.Invoke(wrapper.items);
                }
                catch (Exception e)
                {
                    onError?.Invoke(e.Message);
                }
            }, onError));
        }

        /// <summary>
        /// Lấy Bảng Phong Thần từ MySQL Backend
        /// </summary>
        public void FetchLeaderboard(Action<List<LeaderboardEntry>> onSuccess, Action<string> onError)
        {
            StartCoroutine(GetRequest($"{baseUrl}/leaderboard?limit=20", (json) =>
            {
                try
                {
                    string wrappedJson = "{\"items\":" + json + "}";
                    LeaderboardListWrapper wrapper = JsonUtility.FromJson<LeaderboardListWrapper>(wrappedJson);
                    onSuccess?.Invoke(wrapper.items);
                }
                catch (Exception e)
                {
                    onError?.Invoke(e.Message);
                }
            }, onError));
        }

        /// <summary>
        /// Gửi kết quả Độ Kiếp ghi danh vào Bảng Phong Thần
        /// </summary>
        public void SubmitScore(ScoreSubmissionRequest req, Action<bool> onComplete)
        {
            string bodyJson = JsonUtility.ToJson(req);
            StartCoroutine(PostRequest($"{baseUrl}/leaderboard", bodyJson, (res) =>
            {
                onComplete?.Invoke(true);
            }, (err) =>
            {
                Debug.LogError($"[MeowchaApiClient] Gửi điểm thất bại: {err}");
                onComplete?.Invoke(false);
            }));
        }

        /// <summary>
        /// Tải 3 slot Ngọc Giản lưu trữ từ MySQL
        /// </summary>
        public void FetchSaveSlots(Action<Dictionary<int, SaveSlotData>> onSuccess, Action<string> onError)
        {
            StartCoroutine(GetRequest($"{baseUrl}/saves", (json) =>
            {
                // Parse save slots
                onSuccess?.Invoke(new Dictionary<int, SaveSlotData>());
            }, onError));
        }

        // ==========================================
        // HTTP HELPERS (UnityWebRequest)
        // ==========================================
        private IEnumerator GetRequest(string uri, Action<string> onSuccess, Action<string> onError)
        {
            using (UnityWebRequest req = UnityWebRequest.Get(uri))
            {
                req.timeout = 10;
                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    onSuccess?.Invoke(req.downloadHandler.text);
                }
                else
                {
                    onError?.Invoke(req.error);
                }
            }
        }

        private IEnumerator PostRequest(string uri, string jsonBody, Action<string> onSuccess, Action<string> onError)
        {
            using (UnityWebRequest req = new UnityWebRequest(uri, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 10;
                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    onSuccess?.Invoke(req.downloadHandler.text);
                }
                else
                {
                    onError?.Invoke(req.error);
                }
            }
        }

        [Serializable]
        private class VocabListWrapper { public List<VocabItem> items; }
        [Serializable]
        private class LeaderboardListWrapper { public List<LeaderboardEntry> items; }
    }
}
