# MEOW-CHA: VẠN KIẾM QUY TÔNG (UNITY 2D ENGINE)

Dự án Unity 2D hoàn chỉnh cho trò chơi luyện từ vựng IELTS Tiên Hiệp, kết nối trực tiếp với hệ thống **FastAPI & MySQL Database** của IELTS Oasis.

---

## 1. Cấu Trúc Mã Nguồn C# (`Assets/Scripts/`)

| Thư mục / File                     | Chức năng chính                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Core/MeowchaGameManager.cs`       | Vòng lặp trò chơi, xử lý bàn phím, điều phối sinh ma thạch, tính điểm Tu Vi và Game Over                                                                          |
| `Player/MeowchaCatController.cs`   | Bộ điều khiển Miêu Kiếm Tôn, biến hình 5 cảnh giới (Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh, Thái Thượng), hoạt ảnh nhún chân chém kiếm (lunge), squash & stretch |
| `Combat/MeowchaAsteroid.cs`        | Vật lý ma thạch rơi, hiển thị từ vựng IELTS + IPA + nghĩa, kiểm tra gõ ký tự, trừ nặng -20 HP khi chạm đáy                                                        |
| `Combat/MeowchaSwordProjectile.cs` | Phi kiếm 3D bay lên theo vector vận tốc, vệt sáng kiếm khí (TrailRenderer), homing trúng mục tiêu                                                                 |
| `Networking/MeowchaApiClient.cs`   | Kết nối REST API `UnityWebRequest` tới MySQL backend (`/api/meowcha/vocab`, `/leaderboard`, `/saves`)                                                             |
| `Data/MeowchaModels.cs`            | Định nghĩa dữ liệu tuần tự hóa (Serializable Models)                                                                                                              |

---

## 2. Kết Nối Backend MySQL

Trong `MeowchaApiClient.cs`, cấu hình URL server:

```csharp
[SerializeField] private string baseUrl = "/api/meowcha";
```

- Khi chạy thử nội bộ (Localhost): Đổi thành `http://localhost:8000/api/meowcha`.
- Tự động fallback sang kho từ vựng tích hợp offline nếu mất kết nối mạng.

---

## 3. Quy Trình Cài Đặt và Mở trong Unity

1. Cài đặt **Unity Hub** và **Unity 6+ (hoặc 2022.3 LTS / 2023 LTS)** với module `WebGL Build Support` hoặc `Windows/Android Build Support`.
2. Mở Unity Hub -> Chọn `Add project from disk` -> Trỏ vào thư mục `ielts-oasis/unity/Meowcha2D`.
3. Mở scene chính `Assets/Scenes/MeowchaArena.unity`.
4. Nhấn nút **Play (Ctrl+P)** để trải nghiệm gõ phím trảm ma thạch với 60-120 FPS.
