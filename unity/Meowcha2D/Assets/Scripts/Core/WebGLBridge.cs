using System.Runtime.InteropServices;
using UnityEngine;
using Meowcha.Data;
using Meowcha.Player;
using Meowcha.Combat;

namespace Meowcha.Core
{
    /// <summary>
    /// WebGLBridge — Cầu nối giữa HTML5 Canvas Game và Unity WebGL Runtime.
    /// HTML game gọi các hàm JS, Unity nhận và render nhân vật sống động.
    /// Dùng SendMessage() pattern: JS → gameObject.SendMessage("MethodName", "args")
    /// </summary>
    public class WebGLBridge : MonoBehaviour
    {
        [Header("Controllers điều khiển từ JS")]
        [SerializeField] private MeowchaCatController catController;
        [SerializeField] private PlayerSkillController skillController;

        private static WebGLBridge _instance;
        public static WebGLBridge Instance => _instance;

        private void Awake()
        {
            _instance = this;
            NotifyHTMLGameReady();
        }

        // ==========================================
        // NHẬN LỆNH TỪ JAVASCRIPT
        // ==========================================
        public void SetRealm(string realmIndexStr)
        {
            if (int.TryParse(realmIndexStr, out int idx))
            {
                CultivationRealm realm = (CultivationRealm)Mathf.Clamp(idx, 0, 4);
                if (catController) catController.SetRealm(realm);
                if (skillController) skillController.SetRealm(realm);
            }
        }

        public void TriggerWeakAttack(string targetPosStr)
        {
            if (catController) catController.TriggerWeakAttack();
            string[] parts = targetPosStr.Split(',');
            if (parts.Length == 2 && float.TryParse(parts[0], out float tx) && float.TryParse(parts[1], out float ty))
            {
                Vector3 worldTarget = CanvasToWorldPos(tx, ty);
                if (skillController) skillController.TriggerWeakAttack(worldTarget);
            }
        }

        public void TriggerUltimateBlast(string _)
        {
            if (catController) catController.TriggerUltimateBlast();
            if (skillController) skillController.TriggerUltimateBlast();
        }

        public void TriggerHurt(string _)
        {
            if (catController) catController.TriggerHurt();
            if (skillController) skillController.TriggerHurtState();
        }

        public void TriggerDefeated(string _)
        {
            if (catController) catController.TriggerHurt();
        }

        // ==========================================
        // GỌI NGƯỢC VỀ JAVASCRIPT (Unity → HTML)
        // ==========================================
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void MeowchaUnityReady();
        [DllImport("__Internal")] private static extern void MeowchaOnParticleEvent(string ev);
#endif

        private void NotifyHTMLGameReady()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            MeowchaUnityReady();
#else
            Debug.Log("[WebGLBridge] Editor mode — bridge initialized");
#endif
        }

        public static void FireParticleEvent(string eventName)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            MeowchaOnParticleEvent(eventName);
#endif
        }

        private Vector3 CanvasToWorldPos(float canvasX, float canvasY)
        {
            Camera cam = Camera.main;
            if (!cam) return Vector3.zero;
            float nx = canvasX / Screen.width;
            float ny = 1f - (canvasY / Screen.height);
            return cam.ViewportToWorldPoint(new Vector3(nx, ny, cam.nearClipPlane + 1f));
        }
    }
}
