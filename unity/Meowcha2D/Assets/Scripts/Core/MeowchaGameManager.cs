using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Meowcha.Data;
using Meowcha.Player;
using Meowcha.Combat;
using Meowcha.Networking;

namespace Meowcha.Core
{
    public class MeowchaGameManager : MonoBehaviour
    {
        public static MeowchaGameManager Instance { get; private set; }

        [Header("Scene References")]
        [SerializeField] private MeowchaCatController catController;
        [SerializeField] private Transform spawnPoint;
        [SerializeField] private GameObject asteroidPrefab;
        [SerializeField] private GameObject swordPrefab;
        [SerializeField] private Camera mainCamera;

        [Header("Player Stats")]
        [SerializeField] private int playerHP = 50;
        [SerializeField] private int playerMaxHP = 50;
        [SerializeField] private int cultivationScore = 0;
        [SerializeField] private int wordsSlainCount = 0;
        [SerializeField] private CultivationRealm currentRealm = CultivationRealm.LuyenKhi;

        private MeowchaAsteroid currentActiveAsteroid;
        private List<VocabItem> vocabPool = new List<VocabItem>();
        private int currentBand = 6;
        private bool isGameActive = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            // Tải danh sách từ vựng ban đầu từ MySQL backend
            MeowchaApiClient.Instance.FetchVocabulary(currentBand, (items) =>
            {
                vocabPool = items;
                StartBattle();
            }, (err) =>
            {
                Debug.LogWarning($"Dùng từ vựng offline fallback: {err}");
                LoadFallbackVocab();
                StartBattle();
            });
        }

        public void StartBattle()
        {
            playerHP = playerMaxHP;
            cultivationScore = 0;
            wordsSlainCount = 0;
            isGameActive = true;
            catController.SetRealm(currentRealm);
            SpawnNextAsteroid();
        }

        private void Update()
        {
            if (!isGameActive) return;

            // Xử lý gõ phím từ người chơi
            foreach (char c in Input.inputString)
            {
                if (char.IsLetter(c))
                {
                    HandleKeystroke(c);
                }
            }
        }

        private void HandleKeystroke(char c)
        {
            if (currentActiveAsteroid == null) return;

            bool isHit = currentActiveAsteroid.TryTypeCharacter(c);
            if (isHit)
            {
                catController.TriggerWeakAttack();
                SpawnSwordProjectile(currentActiveAsteroid.transform.position);
            }
            else
            {
                // Gõ sai: Rung nhẹ báo hiệu, không trừ máu oan
                StartCoroutine(CameraShakeRoutine(0.12f, 0.05f));
            }
        }

        private void SpawnSwordProjectile(Vector3 targetPos)
        {
            if (!swordPrefab) return;
            GameObject swordObj = Instantiate(swordPrefab, catController.transform.position + new Vector3(0, 0.5f, 0), Quaternion.identity);
            MeowchaSwordProjectile proj = swordObj.GetComponent<MeowchaSwordProjectile>();
            if (proj)
            {
                Color glowColor = GetRealmColor(currentRealm);
                proj.Launch(catController.transform.position, targetPos, glowColor);
            }
        }

        private void OnAsteroidDestroyed(MeowchaAsteroid asteroid)
        {
            wordsSlainCount++;
            cultivationScore += 100;
            catController.TriggerUltimateBlast();
            CheckRealmBreakthrough();

            // Đệm 350ms hiển thị thẻ từ trước khi sinh từ mới
            StartCoroutine(DelayedSpawnRoutine(0.35f));
        }

        private void OnAsteroidMissed(MeowchaAsteroid asteroid)
        {
            // THIÊN THẠCH RƠI CHẠM ĐÁY: TRỪ NẶNG 20 HP, RUNG CHẤN BẠO LIỆT!
            playerHP = Mathf.Max(0, playerHP - 20);
            catController.TriggerHurt();
            StartCoroutine(CameraShakeRoutine(0.45f, 0.28f));

            if (playerHP <= 0)
            {
                TriggerGameOver();
            }
            else
            {
                StartCoroutine(DelayedSpawnRoutine(0.5f));
            }
        }

        private void CheckRealmBreakthrough()
        {
            CultivationRealm next = currentRealm;
            if (cultivationScore >= 2000) next = CultivationRealm.ThaiThuong;
            else if (cultivationScore >= 1200) next = CultivationRealm.NguyenAnh;
            else if (cultivationScore >= 600) next = CultivationRealm.KimDan;
            else if (cultivationScore >= 200) next = CultivationRealm.TrucCo;

            if (next != currentRealm)
            {
                currentRealm = next;
                catController.SetRealm(currentRealm);
            }
        }

        private void TriggerGameOver()
        {
            isGameActive = false;
            Debug.Log($"[GAME OVER] Đan điền chấn vỡ! Tổng điểm: {cultivationScore}, Từ đã trảm: {wordsSlainCount}");

            // Gửi điểm lên MySQL Bảng Phong Thần
            ScoreSubmissionRequest req = new ScoreSubmissionRequest
            {
                player_name = "Bạch Miêu Kiếm Tu",
                score = cultivationScore,
                words_slain = wordsSlainCount,
                realm = currentRealm.ToString(),
                accuracy = 95f,
                wpm = 45
            };
            MeowchaApiClient.Instance.SubmitScore(req, null);
        }

        private void SpawnNextAsteroid()
        {
            if (!isGameActive || vocabPool.Count == 0 || !asteroidPrefab) return;

            VocabItem item = vocabPool[UnityEngine.Random.Range(0, vocabPool.Count)];
            GameObject astObj = Instantiate(asteroidPrefab, spawnPoint.position, Quaternion.identity);
            currentActiveAsteroid = astObj.GetComponent<MeowchaAsteroid>();

            float speedMult = 1.0f + (int)currentRealm * 0.25f;
            currentActiveAsteroid.Initialize(item, speedMult, OnAsteroidMissed, OnAsteroidDestroyed);
        }

        private IEnumerator DelayedSpawnRoutine(float delay)
        {
            yield return new WaitForSeconds(delay);
            SpawnNextAsteroid();
        }

        private IEnumerator CameraShakeRoutine(float duration, float magnitude)
        {
            Vector3 originalPos = mainCamera.transform.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float x = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                float y = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                mainCamera.transform.position = new Vector3(originalPos.x + x, originalPos.y + y, originalPos.z);
                yield return null;
            }

            mainCamera.transform.position = originalPos;
        }

        private Color GetRealmColor(CultivationRealm realm)
        {
            switch (realm)
            {
                case CultivationRealm.TrucCo: return new Color(0.2f, 0.8f, 1f);
                case CultivationRealm.KimDan: return new Color(1f, 0.85f, 0.2f);
                case CultivationRealm.NguyenAnh: return new Color(0.8f, 0.4f, 1f);
                case CultivationRealm.ThaiThuong: return new Color(1f, 0.25f, 0.35f);
                default: return new Color(0.4f, 1f, 0.7f);
            }
        }

        private void LoadFallbackVocab()
        {
            vocabPool = new List<VocabItem>
            {
                new VocabItem { word = "aspire", ipa = "/əˈspaɪər/", meaning = "Khao khát, hướng tới cảnh giới cao" },
                new VocabItem { word = "nurture", ipa = "/ˈnɜːtʃər/", meaning = "Bồi dưỡng, nuôi nấng đạo hạnh" },
                new VocabItem { word = "resilient", ipa = "/rɪˈzɪliənt/", meaning = "Kiên cường, bất khuất trước thiên kiếp" },
                new VocabItem { word = "zenith", ipa = "/ˈzenɪθ/", meaning = "Đỉnh cao tuyệt đỉnh của tu vi" }
            };
        }
    }
}
