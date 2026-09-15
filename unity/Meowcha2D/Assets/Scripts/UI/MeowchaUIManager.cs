using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Meowcha.Data;
using Meowcha.Combat;

namespace Meowcha.UI
{
    /// <summary>
    /// MeowchaUIManager - Quản trị giao diện Cổ phong Tiên Đạo trong Unity Canvas.
    /// Tái hiện 100% phong cách thẩm mỹ mộc trầm, chu sa và vàng kim từ bản gốc.
    /// </summary>
    public class MeowchaUIManager : MonoBehaviour
    {
        [Header("Top HUD Elements")]
        [SerializeField] private TextMeshProUGUI realmBadgeText;
        [SerializeField] private TextMeshProUGUI levelBadgeText;
        [SerializeField] private TextMeshProUGUI hpText;
        [SerializeField] private Image[] hpSegments;
        [SerializeField] private TextMeshProUGUI wpmText;
        [SerializeField] private TextMeshProUGUI wordsSlainText;
        [SerializeField] private TextMeshProUGUI scoreText;

        [Header("IPA Vocab Study Card")]
        [SerializeField] private GameObject ipaCardPanel;
        [SerializeField] private TextMeshProUGUI cardWordText;
        [SerializeField] private TextMeshProUGUI cardIpaText;
        [SerializeField] private TextMeshProUGUI cardMeaningText;

        [Header("Game Over / Rebirth Modal")]
        [SerializeField] private GameObject gameOverPanel;
        [SerializeField] private TextMeshProUGUI finalScoreText;
        [SerializeField] private TextMeshProUGUI finalWordsText;
        [SerializeField] private Button rebirthButton;

        private Coroutine ipaCardCoroutine;

        private void Start()
        {
            if (TypingCombatController.Instance != null)
            {
                TypingCombatController.Instance.OnHPChanged += UpdateHPDisplay;
                TypingCombatController.Instance.OnStatsUpdated += UpdateStatsDisplay;
                TypingCombatController.Instance.OnRealmUpgraded += UpdateRealmBadge;
                TypingCombatController.Instance.OnWordDefeated += ShowIpaStudyToast;
                TypingCombatController.Instance.OnGameOver += ShowGameOverModal;
            }

            if (rebirthButton)
            {
                rebirthButton.onClick.AddListener(OnRebirthClicked);
            }

            if (gameOverPanel) gameOverPanel.SetActive(false);
            if (ipaCardPanel) ipaCardPanel.SetActive(false);
        }

        private void OnDestroy()
        {
            if (TypingCombatController.Instance != null)
            {
                TypingCombatController.Instance.OnHPChanged -= UpdateHPDisplay;
                TypingCombatController.Instance.OnStatsUpdated -= UpdateStatsDisplay;
                TypingCombatController.Instance.OnRealmUpgraded -= UpdateRealmBadge;
                TypingCombatController.Instance.OnWordDefeated -= ShowIpaStudyToast;
                TypingCombatController.Instance.OnGameOver -= ShowGameOverModal;
            }
        }

        private void UpdateHPDisplay(int current, int max)
        {
            if (hpText) hpText.text = $"{current}/{max}";

            if (hpSegments != null)
            {
                float pct = Mathf.Clamp01((float)current / max);
                int activeCount = Mathf.RoundToInt(pct * hpSegments.Length);

                for (int i = 0; i < hpSegments.Length; i++)
                {
                    hpSegments[i].color = (i < activeCount)
                        ? new Color(0.47f, 0.57f, 0.38f)   // Xanh matcha (#789262)
                        : new Color(0.16f, 0.10f, 0.07f);  // Gỗ tối (#281a11)
                }
            }
        }

        private void UpdateStatsDisplay(int score, int slain, int wpm)
        {
            if (scoreText) scoreText.text = score.ToString();
            if (wordsSlainText) wordsSlainText.text = $"{slain} Từ";
            if (wpmText) wpmText.text = $"{wpm} WPM";
        }

        private void UpdateRealmBadge(CultivationRealm realm)
        {
            if (!realmBadgeText) return;
            string realmName = "Luyện Khí Kỳ";
            switch (realm)
            {
                case CultivationRealm.TrucCo: realmName = "Trúc Cơ Kỳ"; break;
                case CultivationRealm.KimDan: realmName = "Kim Đan Kỳ"; break;
                case CultivationRealm.NguyenAnh: realmName = "Nguyên Anh Kỳ"; break;
                case CultivationRealm.ThaiThuong: realmName = "Thái Thượng Miêu Tôn"; break;
            }
            realmBadgeText.text = realmName;
        }

        private void ShowIpaStudyToast(VocabItem item)
        {
            if (!ipaCardPanel || item == null) return;
            if (ipaCardCoroutine != null) StopCoroutine(ipaCardCoroutine);
            ipaCardCoroutine = StartCoroutine(IpaToastRoutine(item));
        }

        private IEnumerator IpaToastRoutine(VocabItem item)
        {
            if (cardWordText) cardWordText.text = item.word.ToUpper();
            if (cardIpaText) cardIpaText.text = item.ipa;
            if (cardMeaningText) cardMeaningText.text = item.meaning;

            ipaCardPanel.SetActive(true);
            yield return new WaitForSeconds(1.8f);
            ipaCardPanel.SetActive(false);
        }

        private void ShowGameOverModal(int finalScore, int wordsSlain)
        {
            if (!gameOverPanel) return;
            if (finalScoreText) finalScoreText.text = $"{finalScore} pts";
            if (finalWordsText) finalWordsText.text = $"{wordsSlain} Từ Vựng Đã Trảm";
            gameOverPanel.SetActive(true);
        }

        private void OnRebirthClicked()
        {
            if (gameOverPanel) gameOverPanel.SetActive(false);
            if (TypingCombatController.Instance)
            {
                TypingCombatController.Instance.StartNewBattle(6, CultivationRealm.LuyenKhi);
            }
        }
    }
}
