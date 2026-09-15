using System.Collections;
using UnityEngine;
using Meowcha.Data;
using Meowcha.Combat;

namespace Meowcha.Player
{
    /// <summary>
    /// PlayerSkillController - Quản lý toàn bộ 5 pháp tướng, kỹ năng trấn phái
    /// và hoạt ảnh sống động theo từng cảnh giới tu tiên cổ phong.
    /// </summary>
    public class PlayerSkillController : MonoBehaviour
    {
        [Header("Sprite Renderer & 5 Cảnh Giới Costumes")]
        [SerializeField] private SpriteRenderer catRenderer;
        [SerializeField] private Sprite spriteLuyenKhi;       // [1] Nón lá trúc
        [SerializeField] private Sprite spriteTrucCo;         // [2] Bích ngọc song kiếm
        [SerializeField] private Sprite spriteKimDan;          // [3] Hoàng bào đài sen
        [SerializeField] private Sprite spriteNguyenAnh;       // [4] Tử y thần lôi
        [SerializeField] private Sprite spriteThaiThuong;      // [5] Cửu thiên đế vương
        [SerializeField] private Sprite spriteHurt;           // Bị thương chấn động
        [SerializeField] private Sprite spriteDefeated;       // Tử trận trùng sinh

        [Header("Hiệu Ứng Thần Thông Từng Cảnh Giới")]
        [SerializeField] private ParticleSystem greenBambooSlashVfx;  // Luyện Khí
        [SerializeField] private ParticleSystem dualJadeSwordVfx;     // Trúc Cơ
        [SerializeField] private GameObject goldenLotusPedestal;      // Kim Đan: Đài sen vàng xoay
        [SerializeField] private GameObject nascentSoulChibiAvatar;   // Nguyên Anh: Anh linh chibi
        [SerializeField] private GameObject celestialGoldenDragon;    // Thái Thượng: Chân long uốn lượn
        [SerializeField] private ParticleSystem breakthroughAuraVfx;  // Đột phá cảnh giới

        [Header("Flying Sword Projectile Prefab")]
        [SerializeField] private GameObject swordProjectilePrefab;

        private Vector3 initialPosition;
        private Coroutine activeAnimCoroutine;
        private CultivationRealm currentRealm = CultivationRealm.LuyenKhi;

        private void Awake()
        {
            initialPosition = transform.position;
        }

        /// <summary>
        /// Thăng cấp cảnh giới tu tiên - Kích hoạt hào quang và thay đổi pháp tướng
        /// </summary>
        public void SetRealm(CultivationRealm realm)
        {
            currentRealm = realm;

            // Ẩn tất cả linh bảo của các cảnh giới khác
            if (goldenLotusPedestal) goldenLotusPedestal.SetActive(false);
            if (nascentSoulChibiAvatar) nascentSoulChibiAvatar.SetActive(false);
            if (celestialGoldenDragon) celestialGoldenDragon.SetActive(false);

            switch (realm)
            {
                case CultivationRealm.LuyenKhi:
                    catRenderer.sprite = spriteLuyenKhi;
                    break;
                case CultivationRealm.TrucCo:
                    catRenderer.sprite = spriteTrucCo;
                    break;
                case CultivationRealm.KimDan:
                    catRenderer.sprite = spriteKimDan;
                    if (goldenLotusPedestal) goldenLotusPedestal.SetActive(true);
                    break;
                case CultivationRealm.NguyenAnh:
                    catRenderer.sprite = spriteNguyenAnh;
                    if (nascentSoulChibiAvatar) nascentSoulChibiAvatar.SetActive(true);
                    break;
                case CultivationRealm.ThaiThuong:
                    catRenderer.sprite = spriteThaiThuong;
                    if (celestialGoldenDragon) celestialGoldenDragon.SetActive(true);
                    break;
            }

            // Kích hoạt hiệu ứng bừng nở hào quang đột phá
            if (breakthroughAuraVfx) breakthroughAuraVfx.Play();
        }

        /// <summary>
        /// Kích hoạt hoạt ảnh xuất kiếm khi gõ đúng ký tự (Weak Attack)
        /// </summary>
        public void TriggerWeakAttack(Vector3 targetPosition)
        {
            if (activeAnimCoroutine != null) StopCoroutine(activeAnimCoroutine);
            activeAnimCoroutine = StartCoroutine(SlashLungeRoutine(0.18f, 0.42f));

            // Kích hoạt hạt kiếm khí tương ứng theo cảnh giới
            if (currentRealm == CultivationRealm.LuyenKhi && greenBambooSlashVfx)
            {
                greenBambooSlashVfx.Play();
            }
            else if (currentRealm >= CultivationRealm.TrucCo && dualJadeSwordVfx)
            {
                dualJadeSwordVfx.Play();
            }

            // Phóng kiếm khí bay lên mục tiêu
            SpawnFlyingSword(targetPosition);
        }

        /// <summary>
        /// Kích hoạt Đại Chiêu Vạn Kiếm Quy Tông khi phá vỡ toàn bộ từ vựng
        /// </summary>
        public void TriggerUltimateBlast()
        {
            if (activeAnimCoroutine != null) StopCoroutine(activeAnimCoroutine);
            activeAnimCoroutine = StartCoroutine(UltimateLeapRoutine(0.55f, 0.85f));
        }

        /// <summary>
        /// Hoạt ảnh khi bị ma thạch chấn động đan điền
        /// </summary>
        public void TriggerHurtState()
        {
            if (activeAnimCoroutine != null) StopCoroutine(activeAnimCoroutine);
            activeAnimCoroutine = StartCoroutine(HurtRecoilRoutine(0.35f));
        }

        private void SpawnFlyingSword(Vector3 targetPos)
        {
            if (!swordProjectilePrefab) return;
            GameObject swordObj = Instantiate(swordProjectilePrefab, transform.position + new Vector3(0, 0.6f, 0), Quaternion.identity);
            MeowchaSwordProjectile proj = swordObj.GetComponent<MeowchaSwordProjectile>();
            if (proj)
            {
                Color realmColor = GetRealmBladeColor(currentRealm);
                proj.Launch(transform.position, targetPos, realmColor);
            }
        }

        private IEnumerator SlashLungeRoutine(float duration, float jumpHeight)
        {
            float elapsed = 0f;
            Vector3 startPos = initialPosition;
            Vector3 baseScale = Vector3.one;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                float sinWave = Mathf.Sin(progress * Mathf.PI);

                // Nhún chân phóng vút lên theo trục Y
                transform.position = startPos + new Vector3(0, sinWave * jumpHeight, 0);

                // Hiệu ứng Squash & Stretch dãn thân theo đòn đánh
                float scaleX = 1.0f - sinWave * 0.10f;
                float scaleY = 1.0f + sinWave * 0.18f;
                transform.localScale = new Vector3(scaleX, scaleY, 1f);

                yield return null;
            }

            transform.position = initialPosition;
            transform.localScale = baseScale;
        }

        private IEnumerator UltimateLeapRoutine(float duration, float jumpHeight)
        {
            float elapsed = 0f;
            Vector3 baseScale = Vector3.one;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                float wave = Mathf.Sin(progress * Mathf.PI);

                // Bay vút lên không trung thi triển vạn kiếm
                transform.position = initialPosition + new Vector3(0, wave * jumpHeight, 0);

                float scaleX = 1.0f - wave * 0.14f;
                float scaleY = 1.0f + wave * 0.25f;
                transform.localScale = new Vector3(scaleX, scaleY, 1f);

                yield return null;
            }

            transform.position = initialPosition;
            transform.localScale = baseScale;
        }

        private IEnumerator HurtRecoilRoutine(float duration)
        {
            catRenderer.sprite = spriteHurt;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float shakeX = Random.Range(-0.12f, 0.12f);
                float shakeY = Random.Range(-0.06f, 0.06f);
                transform.position = initialPosition + new Vector3(shakeX, shakeY, 0);
                yield return null;
            }

            transform.position = initialPosition;
            SetRealm(currentRealm);
        }

        private Color GetRealmBladeColor(CultivationRealm realm)
        {
            switch (realm)
            {
                case CultivationRealm.TrucCo: return new Color(0.35f, 0.85f, 1f);       // Lam ngọc
                case CultivationRealm.KimDan: return new Color(1f, 0.88f, 0.25f);      // Thái dương kim
                case CultivationRealm.NguyenAnh: return new Color(0.85f, 0.45f, 1f);   // Thần lôi tím
                case CultivationRealm.ThaiThuong: return new Color(1f, 0.3f, 0.35f);    // Huyết long xích kim
                default: return new Color(0.4f, 1f, 0.7f);                             // Thanh trúc lục
            }
        }
    }
}
