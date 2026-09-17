#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using System.IO;

namespace Meowcha.Editor
{
    /// <summary>
    /// MeowchaWebGLBuilder — Unity Editor script để build WebGL tự động.
    /// Chạy từ command line: Unity.exe -batchmode -quit -projectPath . -executeMethod Meowcha.Editor.MeowchaWebGLBuilder.BuildWebGL
    /// </summary>
    public static class MeowchaWebGLBuilder
    {
        // Output path tương đối tính từ root dự án
        private const string OUTPUT_PATH = "../../frontend/public/meowcha/unity-webgl";

        [MenuItem("Meowcha/Build WebGL")]
        public static void BuildWebGL()
        {
            string buildPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", OUTPUT_PATH));

            Debug.Log($"[MeowchaBuilder] Building WebGL to: {buildPath}");
            Directory.CreateDirectory(buildPath);

            // Cấu hình WebGL build
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None; // Production
            PlayerSettings.WebGL.template = "PROJECT:Minimal"; // Dùng template tối giản

            // Đặt kích thước canvas khớp với container HTML
            PlayerSettings.defaultWebScreenWidth = 900;
            PlayerSettings.defaultWebScreenHeight = 600;

            // Strip unused engine code để giảm kích thước build
            PlayerSettings.stripEngineCode = true;
            EditorUserBuildSettings.il2CppCodeGeneration = Il2CppCodeGeneration.OptimizeSize;

            BuildPlayerOptions opts = new BuildPlayerOptions
            {
                scenes = new[] { "Assets/Scenes/GameScene.unity" },
                locationPathName = buildPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            BuildPipeline.BuildPlayer(opts);
            Debug.Log("[MeowchaBuilder] WebGL build complete!");
        }

        [MenuItem("Meowcha/Build WebGL (Development)")]
        public static void BuildWebGLDev()
        {
            string buildPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", OUTPUT_PATH + "-dev"));
            Directory.CreateDirectory(buildPath);

            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.FullWithStacktrace;

            BuildPlayerOptions opts = new BuildPlayerOptions
            {
                scenes = new[] { "Assets/Scenes/GameScene.unity" },
                locationPathName = buildPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.Development | BuildOptions.AllowDebugging
            };

            BuildPipeline.BuildPlayer(opts);
        }
    }
}
#endif
