import { Alert } from "react-native";

// Try to import Audio, fallback for Expo Go compatibility
let Audio: any = null;
try {
  const ExpoAV = require("expo-av");
  Audio = ExpoAV.Audio;
} catch (error) {
  console.warn("expo-av not available, using fallback implementation");
}

export interface SpeechServiceConfig {
  language?: string;
  timeout?: number;
}

class SpeechService {
  private config: SpeechServiceConfig;

  constructor(config: SpeechServiceConfig = {}) {
    this.config = {
      language: "vi-VN",
      timeout: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Audio) {
        console.warn("Audio module not available, simulating permission grant");
        return true; // For demo purposes in Expo Go
      }

      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting microphone permissions:", error);
      return false;
    }
  }

  /**
   * Set audio mode for recording
   */
  async setAudioMode(): Promise<void> {
    try {
      if (!Audio) {
        console.warn("Audio module not available, skipping audio mode setup");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Error setting audio mode:", error);
      throw new Error("Không thể thiết lập chế độ audio");
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<any> {
    try {
      if (!Audio) {
        console.warn("Audio module not available, creating mock recording");
        // Return a mock recording object for demo
        return {
          stopAndUnloadAsync: async () => {},
          getURI: () => "mock://audio-uri",
        };
      }

      await this.setAudioMode();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      return recording;
    } catch (error) {
      console.error("Error starting recording:", error);
      throw new Error("Không thể bắt đầu ghi âm");
    }
  }

  /**
   * Stop recording and get audio URI
   */
  async stopRecording(recording: any): Promise<string | null> {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      return uri;
    } catch (error) {
      console.error("Error stopping recording:", error);
      throw new Error("Không thể dừng ghi âm");
    }
  }

  /**
   * Convert speech to text
   * Note: This is a simplified implementation for demo
   * In production, you would integrate with services like:
   * - Google Cloud Speech-to-Text
   * - AWS Transcribe
   * - Azure Speech Services
   * - OpenAI Whisper API
   */
  async speechToText(audioUri: string): Promise<string> {
    try {
      console.log("Processing audio file:", audioUri);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo purposes, show user a dialog to enter what they said
      return new Promise((resolve) => {
        Alert.alert(
          "🎤 Voice Recognition (Demo Mode)",
          "Chọn nội dung gần nhất với những gì bạn vừa nói, hoặc nhập tự do:",
          [
            {
              text: "❌ Hủy",
              style: "cancel",
              onPress: () => resolve(""),
            },
            {
              text: "🧴 Tôi cần mua nước tẩy trang",
              onPress: () =>
                resolve("Tôi cần tư vấn về nước tẩy trang phù hợp với da tôi"),
            },
            {
              text: "💧 Sản phẩm cho da dầu",
              onPress: () => resolve("Sản phẩm nào phù hợp với da dầu mụn?"),
            },
            {
              text: "🌸 Skincare cho da nhạy cảm",
              onPress: () => resolve("Tư vấn skincare cho da nhạy cảm"),
            },
            {
              text: "⏰ Routine chăm sóc da",
              onPress: () =>
                resolve("Hướng dẫn routine chăm sóc da buổi sáng và tối"),
            },
            {
              text: "✏️ Nhập tự do",
              onPress: () => {
                // Show a text input dialog
                this.showTextInputDialog(resolve);
              },
            },
          ],
          { cancelable: true, onDismiss: () => resolve("") }
        );
      });
    } catch (error) {
      console.error("Error converting speech to text:", error);
      throw new Error("Không thể chuyển đổi giọng nói thành văn bản");
    }
  }

  /**
   * Show text input dialog for manual speech input
   */
  private showTextInputDialog(resolve: (value: string) => void): void {
    Alert.prompt(
      "✏️ Nhập tin nhắn voice",
      "Nhập nội dung bạn vừa nói:",
      [
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => resolve(""),
        },
        {
          text: "Gửi",
          onPress: (text) => resolve(text || ""),
        },
      ],
      "plain-text",
      "",
      "default"
    );
  }

  /**
   * Speak text using Text-to-Speech
   * Note: Temporarily disabled for Expo Go compatibility
   */
  async speakText(text: string, options?: any): Promise<void> {
    try {
      // TODO: Implement with expo-speech when using development build
      console.log("Text-to-Speech not available in Expo Go:", text);

      // For now, just log the text
      Alert.alert("Text-to-Speech", `Would speak: ${text}`);
    } catch (error) {
      console.error("Error speaking text:", error);
      throw new Error("Không thể phát âm văn bản");
    }
  }

  /**
   * Stop current speech
   */
  async stopSpeaking(): Promise<void> {
    try {
      // TODO: Implement with expo-speech when using development build
      console.log("Stop speaking not available in Expo Go");
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  }

  /**
   * Check if speech is currently speaking
   */
  async isSpeaking(): Promise<boolean> {
    try {
      // TODO: Implement with expo-speech when using development build
      return false;
    } catch (error) {
      console.error("Error checking speech status:", error);
      return false;
    }
  }

  /**
   * Get available voices for Text-to-Speech
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      // TODO: Implement with expo-speech when using development build
      return [];
    } catch (error) {
      console.error("Error getting available voices:", error);
      return [];
    }
  }
}

export const speechService = new SpeechService();
export default speechService;
