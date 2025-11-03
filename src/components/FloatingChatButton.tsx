import React, { useState, useRef, useEffect } from "react";
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  View,
  Text,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChatBot from "./ChatBot";
import { UserProfile } from "../types/ai";

const { width, height } = Dimensions.get("window");

interface FloatingChatButtonProps {
  userProfile?: UserProfile;
  onProductRecommend?: (productId: string) => void;
  availableProducts?: any[];
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  userProfile,
  onProductRecommend,
  availableProducts = [],
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation xung (pulse) để thu hút sự chú ý
    if (showPulse) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();

      // Tắt pulse sau 10 giây
      const timeout = setTimeout(() => {
        setShowPulse(false);
        pulseAnimation.stop();
      }, 10000);

      return () => {
        clearTimeout(timeout);
        pulseAnimation.stop();
      };
    }
  }, [showPulse, pulseAnim]);

  useEffect(() => {
    // Keyboard listeners for floating button adjustment
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
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

  const handlePress = () => {
    setShowPulse(false);

    // Animation khi nhấn
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation xoay icon
    Animated.timing(rotateAnim, {
      toValue: isChatOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsChatOpen(!isChatOpen);
  };

  const handleCloseChat = () => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsChatOpen(false);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <>
      <View
        style={[
          styles.container,
          { bottom: keyboardHeight > 0 ? keyboardHeight + 20 : 55 },
        ]}
      >
        {/* Pulse ring effect */}
        {showPulse && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.7, 0],
                }),
              },
            ]}
          />
        )}

        {/* Main button */}
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotateInterpolate }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.touchable}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isChatOpen ? "close" : "chatbubble-ellipses"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Tooltip */}
        {!isChatOpen && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Tư vấn AI</Text>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </View>

      {/* ChatBot Modal */}
      {isChatOpen && (
        <ChatBot
          userProfile={userProfile}
          onClose={handleCloseChat}
          onProductRecommend={onProductRecommend}
          availableProducts={availableProducts}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    zIndex: 999,
  },
  pulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF99CC",
    top: -10,
    left: -10,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF99CC",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  touchable: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    position: "absolute",
    right: 70,
    top: 15,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    maxWidth: 100,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  tooltipArrow: {
    position: "absolute",
    right: -6,
    top: "50%",
    marginTop: -3,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: "rgba(0,0,0,0.8)",
    borderTopWidth: 3,
    borderTopColor: "transparent",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
});

export default FloatingChatButton;
