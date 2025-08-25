# Hướng dẫn Setup Voice Chat cho Production

## Hiện trạng Demo

Hiện tại voice chat đang chạy ở **demo mode** tương thích với Expo Go:

- ✅ Ghi âm UI/UX hoạt động
- ✅ Animation và states management
- ⚠️ Audio recording sử dụng mock implementation
- ⚠️ Speech-to-text sử dụng manual input dialog

## Để có đầy đủ tính năng, bạn cần:

### 1. Chuyển sang Development Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform android
```

### 2. Enable Native Audio Recording

Trong `speechService.ts`, uncomment và enable:

```typescript
// Đổi từ:
let Audio: any = null;
try {
  const ExpoAV = require("expo-av");
  Audio = ExpoAV.Audio;
} catch (error) {
  console.warn("expo-av not available, using fallback implementation");
}

// Thành:
import { Audio } from "expo-av";
```

### 3. Tích hợp Speech-to-Text Service

Chọn một trong các services sau:

#### Option 1: Google Cloud Speech-to-Text

```bash
npm install @google-cloud/speech
```

```typescript
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient({
  keyFilename: 'path/to/service-account-key.json',
});

async speechToText(audioUri: string): Promise<string> {
  const audio = {
    content: fs.readFileSync(audioUri).toString('base64'),
  };

  const config = {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 16000,
    languageCode: 'vi-VN',
  };

  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');

  return transcription;
}
```

#### Option 2: OpenAI Whisper API

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async speechToText(audioUri: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioUri),
    model: "whisper-1",
    language: "vi",
  });

  return transcription.text;
}
```

#### Option 3: Azure Speech Services

```bash
npm install microsoft-cognitiveservices-speech-sdk
```

```typescript
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

async speechToText(audioUri: string): Promise<string> {
  const speechConfig = sdk.SpeechConfig.fromSubscription("YOUR_KEY", "YOUR_REGION");
  speechConfig.speechRecognitionLanguage = "vi-VN";

  const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioUri));
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(result => {
      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        resolve(result.text);
      } else {
        reject(new Error("Speech recognition failed"));
      }
    });
  });
}
```

### 4. Environment Variables

Tạo file `.env` và thêm:

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/key.json

# OpenAI
OPENAI_API_KEY=your-openai-key

# Azure
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=your-region
```

### 5. File Upload Service

Để upload audio files cho speech services:

```typescript
// Cloudinary example
import { cloudinaryService } from './cloudinaryService';

async uploadAudioForTranscription(audioUri: string): Promise<string> {
  const uploadResult = await cloudinaryService.uploadAudio(audioUri);
  return uploadResult.secure_url;
}
```

### 6. Error Handling & Fallbacks

```typescript
async speechToText(audioUri: string): Promise<string> {
  try {
    // Try primary service (e.g., Google Cloud)
    return await this.googleSpeechToText(audioUri);
  } catch (error) {
    console.warn('Primary speech service failed, trying fallback');

    try {
      // Fallback to secondary service (e.g., OpenAI)
      return await this.openAISpeechToText(audioUri);
    } catch (fallbackError) {
      // Final fallback: manual input
      return await this.manualInputFallback();
    }
  }
}
```

### 7. Performance Optimizations

```typescript
// Compress audio before upload
async compressAudio(audioUri: string): Promise<string> {
  // Use expo-av or react-native-ffmpeg
  // to compress audio file
}

// Cache speech models
const speechModelCache = new Map();

// Offline mode
async enableOfflineSpeech(): Promise<void> {
  // Download and cache speech models
  // for offline recognition
}
```

### 8. Testing

```typescript
// Unit tests
describe("SpeechService", () => {
  it("should transcribe Vietnamese speech correctly", async () => {
    const audioUri = "path/to/test-audio.wav";
    const result = await speechService.speechToText(audioUri);
    expect(result).toContain("skincare");
  });
});
```

## Deployment Checklist

- [ ] Development build created and tested
- [ ] Speech service API keys configured
- [ ] Audio permissions working on device
- [ ] Error handling tested
- [ ] Performance optimization implemented
- [ ] User feedback mechanisms in place
- [ ] Analytics tracking added
- [ ] Accessibility features tested

## Cost Considerations

| Service             | Price Range   | Pros                          | Cons              |
| ------------------- | ------------- | ----------------------------- | ----------------- |
| Google Cloud Speech | $0.006/15s    | High accuracy, many languages | Requires internet |
| OpenAI Whisper      | $0.006/minute | Great for Vietnamese          | API rate limits   |
| Azure Speech        | $1/hour       | Real-time capable             | More expensive    |

## Monitoring & Analytics

```typescript
// Track usage
analytics.track("voice_message_sent", {
  duration: recordingDuration,
  success: transcriptionSuccess,
  service: "google_cloud",
});

// Performance monitoring
const startTime = Date.now();
const result = await speechToText(audioUri);
const duration = Date.now() - startTime;

analytics.track("speech_to_text_performance", {
  duration: duration,
  audio_length: audioLength,
  accuracy: calculateAccuracy(result),
});
```

Sau khi setup xong, voice chat sẽ hoạt động đầy đủ với real speech-to-text!
