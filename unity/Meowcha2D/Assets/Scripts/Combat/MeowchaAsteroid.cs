using System;
using UnityEngine;
using TMPro;
using Meowcha.Data;

namespace Meowcha.Combat
{
    public class MeowchaAsteroid : MonoBehaviour
    {
        [Header("UI Text Displays")]
        [SerializeField] private TextMeshPro wordText;
        [SerializeField] private TextMeshPro ipaText;
        [SerializeField] private TextMeshPro meaningText;

        [Header("Visual Elements")]
        [SerializeField] private SpriteRenderer asteroidSprite;
        [SerializeField] private ParticleSystem fireTrailParticles;
        [SerializeField] private ParticleSystem explosionVfxPrefab;

        public VocabItem VocabData { get; private set; }
        public int TypedIndex { get; private set; } = 0;

        private float fallSpeed = 1.8f;
        private Action<MeowchaAsteroid> onReachDefenseLine;
        private Action<MeowchaAsteroid> onDestroyed;

        public void Initialize(VocabItem data, float speedMultiplier, Action<MeowchaAsteroid> onMiss, Action<MeowchaAsteroid> onKill)
        {
            VocabData = data;
            fallSpeed = 1.8f * speedMultiplier;
            onReachDefenseLine = onMiss;
            onDestroyed = onKill;
            TypedIndex = 0;

            if (wordText) wordText.text = data.word.ToUpper();
            if (ipaText) ipaText.text = data.ipa;
            if (meaningText) meaningText.text = data.meaning;
        }

        private void Update()
        {
            // Trôi dạt bồng bềnh tiên giới
            float sway = Mathf.Sin(Time.time * 2.5f) * 0.15f * Time.deltaTime;
            transform.position += new Vector3(sway, -fallSpeed * Time.deltaTime, 0);

            // Vành đai phòng thủ tại Y = -3.2f
            if (transform.position.y <= -3.2f)
            {
                TriggerImpactMiss();
            }
        }

        public bool TryTypeCharacter(char c)
        {
            if (VocabData == null || TypedIndex >= VocabData.word.Length) return false;

            char expected = char.ToLower(VocabData.word[TypedIndex]);
            if (char.ToLower(c) == expected)
            {
                TypedIndex++;
                UpdateWordDisplayHighlight();

                if (TypedIndex >= VocabData.word.Length)
                {
                    TriggerDestroySuccess();
                }
                return true;
            }
            return false;
        }

        private void UpdateWordDisplayHighlight()
        {
            if (!wordText) return;
            string typedPart = $"<color=#66FFB2>{VocabData.word.Substring(0, TypedIndex).ToUpper()}</color>";
            string remainingPart = $"<color=#FFDF79>{VocabData.word.Substring(TypedIndex).ToUpper()}</color>";
            wordText.text = typedPart + remainingPart;
        }

        private void TriggerDestroySuccess()
        {
            if (explosionVfxPrefab)
            {
                Instantiate(explosionVfxPrefab, transform.position, Quaternion.identity);
            }
            onDestroyed?.Invoke(this);
            Destroy(gameObject);
        }

        private void TriggerImpactMiss()
        {
            if (explosionVfxPrefab)
            {
                Instantiate(explosionVfxPrefab, transform.position, Quaternion.identity);
            }
            onReachDefenseLine?.Invoke(this);
            Destroy(gameObject);
        }
    }
}
