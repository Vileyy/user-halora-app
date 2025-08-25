# Hướng dẫn sử dụng Voice Chat với Halora AI

## Tổng quan

Tính năng Voice Chat cho phép người dùng giao tiếp với Halora AI Assistant bằng giọng nói thay vì chỉ gõ text.

## Tính năng chính

### 🎤 Ghi âm giọng nói

- Nhấn nút microphone (màu xanh lá) để bắt đầu ghi âm
- Nút sẽ chuyển thành màu đỏ và hiển thị icon "stop" khi đang ghi âm
- Nhấn lại để dừng ghi âm

### 🔄 Chuyển đổi Speech-to-Text

- Sau khi ghi âm, hệ thống sẽ tự động chuyển đổi giọng nói thành văn bản
- Tin nhắn sẽ được gửi tự động sau khi chuyển đổi thành công

### 📱 Trải nghiệm người dùng

- **Indicator ghi âm**: Dot đỏ nhấp nháy khi đang ghi âm
- **Loading state**: Hiển thị spinner khi đang xử lý audio
- **Error handling**: Thông báo lỗi rõ ràng khi có vấn đề

## Quyền truy cập

### Android

- `android.permission.RECORD_AUDIO`

### iOS

- `NSMicrophoneUsageDescription`: "Ứng dụng cần quyền truy cập microphone để ghi âm tin nhắn voice cho chatbot AI."

## Cách sử dụng

1. **Mở Chatbot**: Nhấn vào nút chat floating hoặc truy cập ChatBot screen
2. **Bắt đầu ghi âm**: Nhấn nút microphone (🎤) màu xanh lá
3. **Nói**: Phát biểu câu hỏi hoặc yêu cầu tư vấn
4. **Kết thúc**: Nhấn nút stop (⏹️) màu đỏ để dừng ghi âm
5. **Chờ xử lý**: Hệ thống sẽ chuyển đổi và gửi tin nhắn tự động

## Trạng thái nút Voice

| Trạng thái  | Màu sắc           | Icon | Mô tả                          |
| ----------- | ----------------- | ---- | ------------------------------ |
| Sẵn sàng    | Xanh lá (#4CAF50) | 🎤   | Có thể bắt đầu ghi âm          |
| Đang ghi âm | Đỏ (#f44336)      | ⏹️   | Đang ghi âm, nhấn để dừng      |
| Đang xử lý  | Cam (#FF9800)     | ⏳   | Đang chuyển đổi speech-to-text |

## Lưu ý kỹ thuật

### Hiện tại

- Speech-to-text đang sử dụng implementation demo
- Chỉ hỗ trợ ghi âm cơ bản với expo-av

### Tương lai (có thể tích hợp)

- Google Cloud Speech-to-Text
- AWS Transcribe
- Azure Speech Services
- OpenAI Whisper API

## Xử lý lỗi

### Không có quyền microphone

```
"Quyền truy cập microphone"
"Ứng dụng cần quyền truy cập microphone để ghi âm tin nhắn voice."
```

### Lỗi ghi âm

```
"Lỗi"
"Không thể bắt đầu ghi âm. Vui lòng thử lại."
```

### Lỗi xử lý giọng nói

```
"Lỗi xử lý giọng nói"
"Không thể chuyển đổi giọng nói thành văn bản. Vui lòng thử lại hoặc nhập tin nhắn text."
```

## Code Examples

### Bắt đầu ghi âm

```typescript
const startRecording = async () => {
  const hasPermission = await speechService.requestPermissions();
  if (hasPermission) {
    const recording = await speechService.startRecording();
    setRecording(recording);
    setIsRecording(true);
  }
};
```

### Xử lý kết quả

```typescript
const processVoiceMessage = async (audioUri: string) => {
  const transcribedText = await speechService.speechToText(audioUri);
  if (transcribedText) {
    await handleSendMessage(transcribedText);
  }
};
```

## Best Practices

1. **Kiểm tra permissions** trước khi ghi âm
2. **Feedback UX rõ ràng** cho người dùng biết trạng thái
3. **Error handling** toàn diện với fallback options
4. **Performance**: Giới hạn thời gian ghi âm tối đa
5. **Accessibility**: Hỗ trợ cho người dùng khuyết tật

## Troubleshooting

### Microphone không hoạt động

1. Kiểm tra permissions trong Settings
2. Khởi động lại ứng dụng
3. Kiểm tra hardware microphone

### Speech-to-text không chính xác

1. Nói rõ ràng và chậm rãi
2. Giảm tiếng ồn xung quanh
3. Giữ micro gần miệng

### Performance issues

1. Giới hạn thời gian ghi âm
2. Compress audio trước khi upload
3. Cache speech models nếu có thể
