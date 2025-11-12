import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  Image,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiService } from "../services/aiService";
import { ChatMessage, UserProfile } from "../types/ai";

const CHAT_HISTORY_KEY = "chatbot_history";
const CHAT_SESSION_KEY = "chatbot_session_id";

interface ChatBotProps {
  userProfile?: UserProfile;
  onClose: () => void;
  onProductRecommend?: (productId: string) => void;
  availableProducts?: any[];
}

const ChatBot: React.FC<ChatBotProps> = ({
  userProfile,
  onClose,
  onProductRecommend,
  availableProducts = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);

  // Function để lưu chat history vào AsyncStorage
  const saveChatHistory = async (messagesToSave: ChatMessage[]) => {
    try {
      const currentSessionId = await AsyncStorage.getItem(CHAT_SESSION_KEY);
      if (currentSessionId) {
        const historyData = {
          sessionId: currentSessionId,
          messages: messagesToSave,
        };
        await AsyncStorage.setItem(
          CHAT_HISTORY_KEY,
          JSON.stringify(historyData)
        );
      }
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  // Helper function to get valid image URL
  const getValidImageUrl = (imageUrl: string | null | undefined): string => {
    if (
      imageUrl &&
      typeof imageUrl === "string" &&
      imageUrl !== "null" &&
      imageUrl.trim() !== ""
    ) {
      return imageUrl;
    }
    return "https://via.placeholder.com/60x60/FF99CC/FFFFFF?text=SP";
  };

  // Smart suggested questions based on available products and user profile
  const quickReplies = useMemo(() => {
    return generateSmartSuggestedQuestions(availableProducts, userProfile);
  }, [availableProducts, userProfile]);

  // Generate smart suggested questions
  function generateSmartSuggestedQuestions(
    products: any[],
    profile?: UserProfile
  ): string[] {
    const suggestions: string[] = [];

    // Analyze available products to create context-aware suggestions
    if (products && products.length > 0) {
      const categories = new Set<string>();
      const keywords = new Set<string>();

      products.slice(0, 20).forEach((product) => {
        if (product.category) categories.add(product.category.toLowerCase());
        if (product.name) {
          const name = product.name.toLowerCase();
          if (name.includes("serum")) keywords.add("serum");
          if (name.includes("toner")) keywords.add("toner");
          if (name.includes("kem") || name.includes("cream"))
            keywords.add("kem dưỡng");
          if (name.includes("tẩy trang") || name.includes("cleanser"))
            keywords.add("tẩy trang");
          if (name.includes("chống nắng") || name.includes("sunscreen"))
            keywords.add("chống nắng");
          if (name.includes("mụn") || name.includes("acne"))
            keywords.add("mụn");
        }
      });

      // Generate suggestions based on available products
      if (keywords.has("serum")) {
        suggestions.push("Serum nào phù hợp với da của tôi?");
      }
      if (keywords.has("tẩy trang")) {
        suggestions.push("Cách chọn sản phẩm tẩy trang phù hợp?");
      }
      if (keywords.has("kem dưỡng")) {
        suggestions.push("Kem dưỡng ẩm nào tốt?");
      }
      if (keywords.has("chống nắng")) {
        suggestions.push("Kem chống nắng nào phù hợp?");
      }
      if (keywords.has("mụn")) {
        suggestions.push("Sản phẩm trị mụn hiệu quả?");
      }
    }

    // Add profile-based suggestions
    if (profile?.skinType) {
      suggestions.push(`Routine chăm sóc da ${profile.skinType} như thế nào?`);
    } else {
      suggestions.push("Tôi muốn tư vấn về skincare");
    }

    if (profile?.concerns && profile.concerns.length > 0) {
      const mainConcern = profile.concerns[0];
      suggestions.push(`Sản phẩm nào giúp ${mainConcern}?`);
    } else {
      suggestions.push("Sản phẩm nào phù hợp với da của tôi?");
    }

    // Fill remaining slots with general suggestions
    const defaultSuggestions = [
      "Cách chăm sóc da buổi sáng",
      "Routine skincare tối thiểu",
    ];

    // Remove duplicates and limit to 5
    const uniqueSuggestions = Array.from(
      new Set([...suggestions, ...defaultSuggestions])
    ).slice(0, 5);

    return uniqueSuggestions.length > 0
      ? uniqueSuggestions
      : [
          "Tôi muốn tư vấn về skincare",
          "Sản phẩm nào phù hợp với da dầu?",
          "Cách chăm sóc da khô?",
          "Routine chăm sóc da buổi sáng",
          "Sản phẩm trị mụn hiệu quả",
        ];
  }

  // Helper function để tạo welcome message
  const createWelcomeMessage = (): ChatMessage => ({
    id: "welcome",
    text: `Xin chào! 👋 Tôi là trợ lý AI chuyên tư vấn mỹ phẩm của Halora. Tôi có thể giúp bạn:

🌟 Tư vấn sản phẩm phù hợp với làn da
💄 Hướng dẫn routine chăm sóc da
🔍 Tìm kiếm sản phẩm theo nhu cầu
💡 Giải đáp các thắc mắc về skincare

✍️ **Cách sử dụng:**
- Gõ tin nhắn để chat và nhận tư vấn
- Chọn câu hỏi gợi ý bên dưới để bắt đầu nhanh

Bạn cần tư vấn gì hôm nay?`,
    isUser: false,
    timestamp: new Date(),
  });

  // Load chat history và check session
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        // Lấy session ID hiện tại từ App.tsx
        const currentSessionId = await AsyncStorage.getItem(CHAT_SESSION_KEY);
        const savedHistory = await AsyncStorage.getItem(CHAT_HISTORY_KEY);

        if (!currentSessionId) {
          // Chưa có session, tạo welcome message mới
          setMessages([createWelcomeMessage()]);
          return;
        }

        if (savedHistory) {
          try {
            const historyData = JSON.parse(savedHistory);
            const { sessionId, messages: savedMessages } = historyData;

            // Nếu session ID khác (app được khởi động lại), reset chat
            if (sessionId !== currentSessionId) {
              await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
              setMessages([createWelcomeMessage()]);
            } else {
              // Session giống, load lại messages
              const messagesWithDates = savedMessages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }));
              setMessages(messagesWithDates);
            }
          } catch (parseError) {
            console.error("Error parsing chat history:", parseError);
            setMessages([createWelcomeMessage()]);
          }
        } else {
          // Không có history, tạo welcome message
          setMessages([createWelcomeMessage()]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        setMessages([createWelcomeMessage()]);
      }
    };

    loadChatHistory();
    setIsVisible(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Auto scroll when keyboard appears
        setTimeout(() => scrollToBottom(), 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Lưu chat history mỗi khi messages thay đổi (trừ lần đầu load)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Lưu messages vào AsyncStorage
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // Detect khi app được khởi động lại (từ background -> active)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App được mở lại từ background, check session
        const checkSession = async () => {
          try {
            const currentSessionId = await AsyncStorage.getItem(
              CHAT_SESSION_KEY
            );
            const savedHistory = await AsyncStorage.getItem(CHAT_HISTORY_KEY);

            if (savedHistory && currentSessionId) {
              const historyData = JSON.parse(savedHistory);
              // Nếu session ID khác, reset chat
              if (historyData.sessionId !== currentSessionId) {
                await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
                setMessages([createWelcomeMessage()]);
              }
            }
          } catch (error) {
            console.error("Error checking session on app state change:", error);
          }
        };

        checkSession();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleInputFocus = () => {
    // Auto scroll khi focus vào input
    setTimeout(() => scrollToBottom(), 150);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    scrollToBottom();

    try {
      // Call AI service to get response
      const response = await aiService.getCosmeticAdvice(
        messageText,
        {
          skinType: userProfile?.skinType,
          age: userProfile?.age,
          concerns: userProfile?.concerns || [],
          currentProducts: userProfile?.currentProducts || [],
        },
        availableProducts
      );

      // Animation typing effect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const botMessage: ChatMessage = {
        id: Date.now().toString() + "_bot",
        text: response.advice,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      if (
        response.recommendedProducts &&
        response.recommendedProducts.length > 0
      ) {
        const productMessage: ChatMessage = {
          id: Date.now().toString() + "_products",
          text: `💡 Tôi tìm thấy những sản phẩm phù hợp trong cửa hàng:`,
          isUser: false,
          timestamp: new Date(),
          recommendedProducts: response.recommendedProducts,
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, productMessage]);
          scrollToBottom();
        }, 500);
      }
    } catch (error) {
      console.error("ChatBot Error:", error);

      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "_error",
        text: "Xin lỗi, tôi đang gặp một chút vấn đề kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ với đội ngũ tư vấn viên của chúng tôi.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleQuickReply = (reply: string) => {
    // Simply call handleSendMessage like the original behavior
    // This will show user message first, then typing indicator, then AI response with products
    handleSendMessage(reply);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onClose();
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={16} color="#FF99CC" />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.botMessageText,
          ]}
        >
          {item.text}
        </Text>

        {/* Display product recommendations */}
        {item.recommendedProducts && item.recommendedProducts.length > 0 && (
          <View style={styles.productsContainer}>
            {item.recommendedProducts.map((product, index) => (
              <TouchableOpacity
                key={`${product.id}_${index}`}
                style={styles.productCard}
                onPress={() => onProductRecommend?.(product.id)}
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={{
                      uri: getValidImageUrl(product.image),
                    }}
                    style={styles.productImage}
                    defaultSource={require("../assets/image/halora-icon.png")}
                    resizeMode="cover"
                    onError={() =>
                      console.log("Image failed to load:", product.image)
                    }
                  />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productReason} numberOfLines={2}>
                    {product.reason}
                  </Text>
                </View>
                <View style={styles.productAction}>
                  <Ionicons name="chevron-forward" size={16} color="#FF99CC" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.botAvatar}>
        <Ionicons name="sparkles" size={16} color="#FF99CC" />
      </View>
      <View style={styles.typingBubble}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.typingText}>Đang soạn tin...</Text>
      </View>
    </View>
  );

  const renderQuickReplies = () => (
    <View style={styles.quickRepliesContainer}>
      <Text style={styles.quickRepliesTitle}>Gợi ý câu hỏi:</Text>
      <FlatList
        data={quickReplies}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.quickReplyButton}
            onPress={() => handleQuickReply(item)}
          >
            <Text style={styles.quickReplyText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRepliesList}
      />
    </View>
  );

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIndicator}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Halora AI Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? "✍️ Đang trả lời..." : "💬 Tư vấn viên AI"}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {isTyping && renderTypingIndicator()}

        {/* Quick Replies */}
        {messages.length <= 1 && renderQuickReplies()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            onFocus={handleInputFocus}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isTyping}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? "#fff" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  keyboardView: {
    flex: 1,
    marginTop: 50,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF99CC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: "#FF99CC",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#f8f9fa",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  botMessageText: {
    color: "#333",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 18,
  },
  typingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  quickRepliesTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  quickRepliesList: {
    paddingRight: 16,
  },
  quickReplyButton: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quickReplyText: {
    fontSize: 12,
    color: "#333",
  },
  productsContainer: {
    marginTop: 8,
    gap: 8,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productReason: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
  },
  productAction: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF99CC",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
});

export default ChatBot;
