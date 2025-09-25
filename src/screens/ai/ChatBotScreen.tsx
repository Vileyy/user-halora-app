import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { aiService } from "../../services/aiService";
import { ChatMessage, UserProfile } from "../../types/ai";
import { useSelector } from "react-redux";

interface ChatBotScreenProps {
  route?: {
    params?: {
      userProfile?: UserProfile;
      initialMessage?: string;
    };
  };
}

const ChatBotScreen: React.FC<ChatBotScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile, initialMessage } = (route.params as any) || {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Quick reply suggestions
  const [quickReplies] = useState([
    "Tôi muốn tư vấn về skincare",
    "Sản phẩm nào phù hợp với da dầu?",
    "Cách chăm sóc da khô?",
    "Routine chăm sóc da buổi sáng",
    "Sản phẩm trị mụn hiệu quả",
    "Cách chọn kem chống nắng",
    "Tư vấn makeup cho người mới",
    "Sản phẩm dưỡng tóc",
  ]);

  const [showQuickReplies, setShowQuickReplies] = useState(true);

  useEffect(() => {
    // Tin nhắn chào hỏi
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      text: `Xin chào! 👋 Tôi là trợ lý AI chuyên tư vấn mỹ phẩm của Halora. 

Tôi có thể giúp bạn:
🌟 Tư vấn sản phẩm phù hợp với làn da
💄 Hướng dẫn routine chăm sóc da  
🔍 Tìm kiếm sản phẩm theo nhu cầu
💡 Giải đáp các thắc mắc về skincare
🎨 Tư vấn makeup và phong cách

Bạn cần tư vấn gì hôm nay?`,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);

    // Nếu có tin nhắn khởi tạo, gửi ngay
    if (initialMessage) {
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 1000);
    }
  }, [initialMessage]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
    setShowQuickReplies(false);
    scrollToBottom();

    try {
      // Gọi AI service để lấy phản hồi
      const response = await aiService.getCosmeticAdvice(messageText, {
        skinType: userProfile?.skinType,
        age: userProfile?.age,
        concerns: userProfile?.concerns || [],
        currentProducts: userProfile?.currentProducts || [],
      });

      // Hiệu ứng typing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const botMessage: ChatMessage = {
        id: Date.now().toString() + "_bot",
        text: response.advice,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Nếu có sản phẩm được đề xuất
      if (
        response.recommendedProducts &&
        response.recommendedProducts.length > 0
      ) {
        const productMessage: ChatMessage = {
          id: Date.now().toString() + "_products",
          text: `💡 Tôi có một số sản phẩm phù hợp để gợi ý cho bạn. Bạn có muốn xem danh sách sản phẩm được đề xuất không?`,
          isUser: false,
          timestamp: new Date(),
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
        text: "Xin lỗi, tôi đang gặp một chút vấn đề kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ với đội ngũ tư vấn viên của chúng tôi qua hotline: 1900-xxxx.",
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
    setShowQuickReplies(false);
    handleSendMessage(reply);
  };

  const handleViewProducts = () => {
    Alert.alert(
      "Xem sản phẩm được đề xuất",
      "Bạn có muốn được chuyển đến trang sản phẩm được AI đề xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xem ngay",
          onPress: () => {
            // Navigation đến màn hình products hoặc recommendations
            navigation.goBack();
            // (navigation as any).navigate('SearchScreen');
          },
        },
      ]
    );
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

        {/* Hiển thị product recommendations */}
        {item.recommendedProducts && item.recommendedProducts.length > 0 && (
          <View style={styles.productsContainer}>
            {item.recommendedProducts.map((product, index) => (
              <TouchableOpacity
                key={`${product.id}_${index}`}
                style={styles.productCard}
                onPress={() => {
                  // Navigate to product detail or add to cart
                  Alert.alert(
                    "Sản phẩm được đề xuất",
                    `${product.name}\nGiá: ${product.price} VNĐ\n\nLý do đề xuất: ${product.reason}`,
                    [
                      { text: "Đóng", style: "cancel" },
                      {
                        text: "Xem chi tiết",
                        onPress: () => console.log("View product:", product.id),
                      },
                    ]
                  );
                }}
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={{
                      uri:
                        product.image ||
                        "https://via.placeholder.com/60x60/FF99CC/FFFFFF?text=SP",
                    }}
                    style={styles.productImage}
                    defaultSource={require("../../assets/image/halora-icon.png")}
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

        <Text
          style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.botTimestamp,
          ]}
        >
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

  const renderQuickReplies = () => {
    if (!showQuickReplies) return null;

    return (
      <View style={styles.quickRepliesContainer}>
        <Text style={styles.quickRepliesTitle}>💡 Gợi ý câu hỏi:</Text>
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
          numColumns={2}
          contentContainerStyle={styles.quickRepliesList}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF99CC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Halora AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? "Đang trả lời..." : "Tư vấn viên AI"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleViewProducts}
          style={styles.menuButton}
        >
          <Ionicons name="list" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
        {renderQuickReplies()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
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
  keyboardView: {
    flex: 1,
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
    maxWidth: "75%",
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
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userTimestamp: {
    color: "rgba(255,255,255,0.7)",
  },
  botTimestamp: {
    color: "#999",
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
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  quickRepliesList: {
    paddingBottom: 8,
  },
  quickReplyButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flex: 1,
    maxWidth: "48%",
  },
  quickReplyText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
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
  productsContainer: {
    marginTop: 8,
    gap: 8,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
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
    backgroundColor: "#f8f9fa",
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
});

export default ChatBotScreen;
