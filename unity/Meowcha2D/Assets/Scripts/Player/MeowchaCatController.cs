using System.Collections;
using UnityEngine;
using Meowcha.Data;

namespace Meowcha.Player
{
    public class MeowchaCatController : MonoBehaviour
    {
        [Header("Sprite Renderer & 5 Cảnh Giới Models")]
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private Sprite spriteLuyenKhi;       // Cảnh giới 0: Nón lá trúc
        [SerializeField] private Sprite spriteTrucCo;         // Cảnh giới 1: Song kiếm
        [SerializeField] private Sprite spriteKimDan;          // Cảnh giới 2: Hoàng bào đài sen
        [SerializeField] private Sprite spriteNguyenAnh;       // Cảnh giới 3: Tử y anh linh
        [SerializeField] private Sprite spriteThaiThuong;      // Cảnh giới 4: Đế vương chân long
        [SerializeField] private Sprite spriteHurt;
        [SerializeField] private Sprite spriteDefeated;

        [Header("VFX & Particle Systems")]
        [SerializeField] private ParticleSystem attackShockwaveVfx;
        [SerializeField] private ParticleSystem goldenLotusVfx;
        [SerializeField] private ParticleSystem lightningArcVfx;
        [SerializeField] private ParticleSystem celestialDragonVfx;

        private Vector3 initialPosition;
        private Coroutine currentAnimCoroutine;
        private CultivationRealm currentRealm = CultivationRealm.LuyenKhi;

        private void Awake()
        {
            initialPosition = transform.position;
        }

        /// <summary>
        /// Chuyển đổi ngoại hình và pháp tướng theo 5 cảnh giới tiên đạo
        /// </summary>
        public void SetRealm(CultivationRealm realm)
        {
            currentRealm = realm;
            switch (realm)
            {
                case CultivationRealm.LuyenKhi:
                    spriteRenderer.sprite = spriteLuyenKhi;
                    break;
                case CultivationRealm.TrucCo:
                    spriteRenderer.sprite = spriteTrucCo;
                    break;
                case CultivationRealm.KimDan:
                    spriteRenderer.sprite = spriteKimDan;
                    if (goldenLotusVfx) goldenLotusVfx.Play();
                    break;
                case CultivationRealm.NguyenAnh:
                    spriteRenderer.sprite = spriteNguyenAnh;
                    if (lightningArcVfx) lightningArcVfx.Play();
                    break;
                case CultivationRealm.ThaiThuong:
                    spriteRenderer.sprite = spriteThaiThuong;
                    if (celestialDragonVfx) celestialDragonVfx.Play();
                    break;
            }
        }

        /// <summary>
        /// Hoạt ảnh xuất kiếm khi gõ trúng ký tự (Weak Attack): Nhún chân phóng lên 0.4 đơn vị, squash & stretch
        /// </summary>
        public void TriggerWeakAttack()
        {
            if (currentAnimCoroutine != null) StopCoroutine(currentAnimCoroutine);
            currentAnimCoroutine = StartCoroutine(AttackLungeRoutine(0.18f, 0.45f));
            if (attackShockwaveVfx) attackShockwaveVfx.Play();
        }

        /// <summary>
        /// Hoạt ảnh đại chiêu Vạn Kiếm Quy Tông khi phá vỡ ma thạch
        /// </summary>
        public void TriggerUltimateBlast()
        {
            if (currentAnimCoroutine != null) StopCoroutine(currentAnimCoroutine);
            currentAnimCoroutine = StartCoroutine(AttackLungeRoutine(0.55f, 0.85f));
        }

        /// <summary>
        /// Hoạt ảnh chấn động đan điền khi bị thương
        /// </summary>
        public void TriggerHurt()
        {
            if (currentAnimCoroutine != null) StopCoroutine(currentAnimCoroutine);
            currentAnimCoroutine = StartCoroutine(HurtShakeRoutine(0.35f));
        }

        private IEnumerator AttackLungeRoutine(float duration, float jumpHeight)
        {
            float elapsed = 0f;
            Vector3 baseScale = Vector3.one;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                float sinWave = Mathf.Sin(t * Mathf.PI);

                // Lunge upward
                transform.position = initialPosition + new Vector3(0, sinWave * jumpHeight, 0);

                // Squash & Stretch
                float scaleX = 1.0f - sinWave * 0.12f;
                float scaleY = 1.0f + sinWave * 0.22f;
                transform.localScale = new Vector3(scaleX, scaleY, 1f);

                yield return null;
            }

            transform.position = initialPosition;
            transform.localScale = baseScale;
        }

        private IEnumerator HurtShakeRoutine(float duration)
        {
            spriteRenderer.sprite = spriteHurt;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float shakeX = Random.Range(-0.1f, 0.1f);
                float shakeY = Random.Range(-0.05f, 0.05f);
                transform.position = initialPosition + new Vector3(shakeX, shakeY, 0);
                yield return null;
            }

            transform.position = initialPosition;
            SetRealm(currentRealm);
        }
    }
}
