// MeowchaBridge.jslib
// Plugin cho Unity WebGL: export các hàm C# DllImport sang JavaScript thực.
// Unity tự động nhúng code này vào build output.

var MeowchaBridgePlugin = {
  // Gọi khi Unity C# khởi tạo xong — báo cho parent HTML game biết
  MeowchaUnityReady: function() {
    try {
      if (typeof window.MeowchaUnityReady === 'function') {
        window.MeowchaUnityReady();
      }
    } catch(e) {
      console.warn('[MeowchaBridge] MeowchaUnityReady error:', e);
    }
  },

  // Gọi khi particle system Unity hoàn thành (ví dụ: SWORD_HIT, EXPLOSION)
  MeowchaOnParticleEvent: function(eventNamePtr) {
    try {
      var eventName = UTF8ToString(eventNamePtr);
      if (typeof window.MeowchaOnParticleEvent === 'function') {
        window.MeowchaOnParticleEvent(eventName);
      }
    } catch(e) {
      console.warn('[MeowchaBridge] OnParticleEvent error:', e);
    }
  }
};

mergeInto(LibraryManager.library, MeowchaBridgePlugin);
