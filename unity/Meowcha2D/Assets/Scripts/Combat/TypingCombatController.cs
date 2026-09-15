using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Meowcha.Data;
using Meowcha.Database;
using Meowcha.Player;

namespace Meowcha.Combat
{
    /// <summary>
    /// TypingCombatController - Bộ não xử lý cơ chế gõ phím trảm ma thạch,
    /// tính toán tốc độ WPM, trạng thái choáng (Stun state), trừ máu và điều phối nhịp độ trận đấu.
    /// </summary>
    public class TypingCombatController : MonoBehaviour
    {
        public static TypingCombatController Instance { get; private set; }

        [Header("Scene References")]
        [SerializeField] private PlayerSkillController playerSkill;
        [SerializeField] private Transform asteroidSpawnPoint;
        [SerializeField] private GameObject asteroidPrefab;
        [SerializeField] private Camera battleCamera;

        [Header("Defense Line Settings")]
        [SerializeField] private float defenseLineY = -3.2f;

        [Header("Player Vitals")]
        [SerializeField] private int playerMaxHP = 50;
        private int currentHP = 50;

        [Header("Combat Stats")]
        private int cultivationScore = 0;
        private int wordsSlainCount = 0;
        private int consecutiveKills = 0;
        private int correctKeystrokes = 0;
        private int totalKeystrokes = 0;
        private float battleStartTime;

        [Header("State & Delay Timers")]
        private bool isBattleActive = false;
        private bool isStunned = false;
        private float stunTimer = 0f;
        private float keyDebounceTimer = 0f;
        private const float KEY_DEBOUNCE_INTERVAL = 0.04f; // 40ms chống dội phím cơ

        private MeowchaAsteroid currentTargetAsteroid;
        private CultivationRealm currentRealm = CultivationRealm.LuyenKhi;
        private int currentIeltsBand = 6;

        // C# Events đồng bộ với UI
        public event Action<int, int> OnHPChanged;             // currentHP, maxHP
        public event Action<int, int, int> OnStatsUpdated;     // score, wordsSlain, wpm
        public event Action<CultivationRealm> OnRealmUpgraded;
        public event Action<VocabItem> OnWordDefeated;         // Hiện thẻ IPA học từ
        public event Action<int, int> OnGameOver;              // finalScore, totalSlain

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            StartNewBattle(6, CultivationRealm.LuyenKhi);
        }

        /// <summary>
        /// Khởi động trận chiến mới
        /// </summary>
        public void StartNewBattle(int ieltsBand, CultivationRealm initialRealm)
        {
            currentIeltsBand = ieltsBand;
            currentRealm = initialRealm;
            currentHP = playerMaxHP;
            cultivationScore = 0;
            wordsSlainCount = 0;
            consecutiveKills = 0;
            correctKeystrokes = 0;
            totalKeystrokes = 0;
            battleStartTime = Time.time;
            isBattleActive = true;
            isStunned = false;

            OnHPChanged?.Invoke(currentHP, playerMaxHP);
            OnStatsUpdated?.Invoke(cultivationScore, wordsSlainCount, 0);

            if (playerSkill) playerSkill.SetRealm(currentRealm);

            // Nạp từ vựng và sinh thiên thạch đầu tiên
            DatabaseWordManager.Instance.LoadVocabulariesForBand(currentIeltsBand, () =>
            {
                SpawnNextWordAsteroid();
            });
        }

        private void Update()
        {
            if (!isBattleActive) return;

            // Xử lý thời gian choáng (Stun State) khi bị ma thạch phá vỡ phòng tuyến
            if (isStunned)
            {
                stunTimer -= Time.deltaTime;
                if (stunTimer <= 0f)
                {
                    isStunned = false;
                }
                return; // Khi đang choáng thì không nhận phím để tránh spam phím ảo
            }

            // Bộ lọc chống dội phím cơ (Debounce)
            if (keyDebounceTimer > 0f)
            {
                keyDebounceTimer -= Time.deltaTime;
            }

            // Bắt sự kiện bàn phím mượt mà, hỗ trợ cả ký tự hoa và thường
            HandleKeyboardInput();
        }

        private void HandleKeyboardInput()
        {
            if (string.IsNullOrEmpty(Input.inputString) || currentTargetAsteroid == null) return;

            foreach (char rawChar in Input.inputString)
            {
                // Chỉ xử lý các ký tự chữ cái chuẩn tiếng Anh
                if (!char.IsLetter(rawChar)) continue;

                if (keyDebounceTimer > 0f) continue;
                keyDebounceTimer = KEY_DEBOUNCE_INTERVAL;

                totalKeystrokes++;
                char inputChar = char.ToLowerInvariant(rawChar);

                // Thử gõ ký tự vào thiên thạch mục tiêu
                bool isCorrect = currentTargetAsteroid.TryTypeCharacter(inputChar);

                if (isCorrect)
                {
                    correctKeystrokes++;
                    
                    // Kích hoạt hoạt ảnh chém kiếm tức thì theo cảnh giới
                    if (playerSkill)
                    {
                        playerSkill.TriggerWeakAttack(currentTargetAsteroid.transform.position);
                    }

                    UpdateLiveCombatStats();
                }
                else
                {
                    // Gõ sai: Rung nhẹ báo hiệu, phát âm thanh đỡ đòn, KHÔNG trừ máu oan
                    StartCoroutine(ScreenShakeRoutine(0.12f, 0.06f));
                }
            }
        }

        /// <summary>
        /// Xử lý khi người chơi gõ xong toàn bộ từ -> Phá hủy thiên thạch thành công
        /// </summary>
        public void OnAsteroidDestroyed(MeowchaAsteroid asteroid)
        {
            wordsSlainCount++;
            consecutiveKills++;
            int scoreGain = 100 + (int)currentRealm * 25;
            cultivationScore += scoreGain;

            // Kích hoạt Đại Chiêu Vạn Kiếm Quy Tông
            if (playerSkill)
            {
                playerSkill.TriggerUltimateBlast();
            }

            // Thông báo hiển thị thẻ IPA từ vựng để người chơi học
            OnWordDefeated?.Invoke(asteroid.VocabData);

            // Kiểm tra đột phá thăng cấp cảnh giới
            CheckRealmProgression();

            UpdateLiveCombatStats();

            // Đệm delay 350ms trước khi sinh thiên thạch mới để người chơi kịp nhìn nghĩa từ
            StartCoroutine(DelayBeforeNextSpawnRoutine(0.35f));
        }

        /// <summary>
        /// Xử lý khi thiên thạch chạm đáy vạch phòng tuyến -> Phạt mất máu bạo liệt
        /// </summary>
        public void OnAsteroidBreachedDefenseLine(MeowchaAsteroid asteroid)
        {
            consecutiveKills = 0;

            // THIÊN THẠCH RƠI CHẠM ĐÁY: TRỪ NẶNG 20 HP TRÊN TỔNG 50 HP!
            currentHP = Mathf.Max(0, currentHP - 20);
            OnHPChanged?.Invoke(currentHP, playerMaxHP);

            // Kích hoạt trạng thái Choáng (Stun state) 350ms và hoạt ảnh bị thương
            isStunned = true;
            stunTimer = 0.35f;

            if (playerSkill)
            {
                playerSkill.TriggerHurtState();
            }

            // Rung chấn màn hình 24px dữ dội
            StartCoroutine(ScreenShakeRoutine(0.45f, 0.32f));

            if (currentHP <= 0)
            {
                TriggerPlayerGameOver();
            }
            else
            {
                // Đệm 500ms hồi phục trận địa trước khi thiên thạch mới xuất hiện
                StartCoroutine(DelayBeforeNextSpawnRoutine(0.5f));
            }
        }

        private void SpawnNextWordAsteroid()
        {
            if (!isBattleActive || currentHP <= 0) return;

            VocabItem nextWord = DatabaseWordManager.Instance.GetNextBattleWord(currentIeltsBand);
            GameObject obj = Instantiate(asteroidPrefab, asteroidSpawnPoint.position, Quaternion.identity);
            currentTargetAsteroid = obj.GetComponent<MeowchaAsteroid>();

            // Tính toán tốc độ rơi theo Cảnh Giới và Combo WPM
            float speedMultiplier = 1.0f + ((int)currentRealm * 0.25f) + Mathf.Min(0.5f, consecutiveKills * 0.05f);

            currentTargetAsteroid.Initialize(
                nextWord,
                speedMultiplier,
                (ast) => OnAsteroidBreachedDefenseLine(ast),
                (ast) => OnAsteroidDestroyed(ast)
            );
        }

        private void CheckRealmProgression()
        {
            CultivationRealm newRealm = currentRealm;
            if (cultivationScore >= 2000) newRealm = CultivationRealm.ThaiThuong;
            else if (cultivationScore >= 1200) newRealm = CultivationRealm.NguyenAnh;
            else if (cultivationScore >= 600) newRealm = CultivationRealm.KimDan;
            else if (cultivationScore >= 200) newRealm = CultivationRealm.TrucCo;

            if (newRealm > currentRealm)
            {
                currentRealm = newRealm;
                if (playerSkill) playerSkill.SetRealm(currentRealm);
                OnRealmUpgraded?.Invoke(currentRealm);
            }
        }

        private void UpdateLiveCombatStats()
        {
            float elapsedMin = Mathf.Max(0.1f, (Time.time - battleStartTime) / 60f);
            int wpm = Mathf.RoundToInt((correctKeystrokes / 5f) / elapsedMin);
            OnStatsUpdated?.Invoke(cultivationScore, wordsSlainCount, wpm);
        }

        private void TriggerPlayerGameOver()
        {
            isBattleActive = false;
            OnGameOver?.Invoke(cultivationScore, wordsSlainCount);
        }

        private IEnumerator DelayBeforeNextSpawnRoutine(float delaySeconds)
        {
            currentTargetAsteroid = null;
            yield return new WaitForSeconds(delaySeconds);
            SpawnNextWordAsteroid();
        }

        private IEnumerator ScreenShakeRoutine(float duration, float magnitude)
        {
            if (!battleCamera) yield break;
            Vector3 originalPos = battleCamera.transform.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float x = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                float y = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                battleCamera.transform.position = new Vector3(originalPos.x + x, originalPos.y + y, originalPos.z);
                yield return null;
            }

            battleCamera.transform.position = originalPos;
        }
    }
}
