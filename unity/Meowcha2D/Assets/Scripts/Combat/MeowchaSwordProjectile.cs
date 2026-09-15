using UnityEngine;

namespace Meowcha.Combat
{
    public class MeowchaSwordProjectile : MonoBehaviour
    {
        [SerializeField] private TrailRenderer trailRenderer;
        [SerializeField] private SpriteRenderer swordSprite;
        [SerializeField] private float speed = 16f;

        private Transform targetTransform;
        private Vector3 targetPos;
        private bool hasTarget = false;

        public void Launch(Vector3 start, Vector3 target, Color swordGlowColor)
        {
            transform.position = start;
            targetPos = target;
            hasTarget = true;

            if (trailRenderer)
            {
                trailRenderer.startColor = swordGlowColor;
                trailRenderer.endColor = new Color(swordGlowColor.r, swordGlowColor.g, swordGlowColor.b, 0f);
            }

            Vector3 dir = (target - start).normalized;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg - 90f;
            transform.rotation = Quaternion.Euler(0, 0, angle);
        }

        private void Update()
        {
            if (!hasTarget) return;

            transform.position = Vector3.MoveTowards(transform.position, targetPos, speed * Time.deltaTime);

            if (Vector3.Distance(transform.position, targetPos) < 0.15f)
            {
                Destroy(gameObject);
            }
        }
    }
}
