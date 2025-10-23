import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import Toast from "react-native-toast-message";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ForgotPasswordScreen"
>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);

  // Animated values
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;

  // Animate email label
  useEffect(() => {
    Animated.timing(emailLabelAnim, {
      toValue: emailFocused || email.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, email.length]);

  // Animate email border
  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    // Validate email
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Lỗi!",
        text2: "Vui lòng nhập email",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (!validateEmail(email)) {
      Toast.show({
        type: "error",
        text1: "Lỗi!",
        text2: "Email không hợp lệ",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      await sendPasswordResetEmail(auth, email);

      setIsLoading(false);

      Toast.show({
        type: "success",
        text1: "Thành công!",
        text2: "Link đặt lại mật khẩu đã được gửi đến email của bạn",
        position: "top",
        visibilityTime: 4000,
      });

      // Navigate back to login after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      console.log("Error sending reset email:", error);

      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại!";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Email này chưa được đăng ký";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email không hợp lệ";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau";
      }

      Toast.show({
        type: "error",
        text1: "Lỗi!",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <SafeAreaView style={styles.flex}>
        <StatusBar barStyle="light-content" backgroundColor="#FF99CC" />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Icon Section */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon name="lock-closed-outline" size={80} color="#FF99CC" />
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Text style={styles.subtitle}>
              Nhập email đã đăng ký của bạn và chúng tôi sẽ gửi link đặt lại mật
              khẩu cho bạn
            </Text>

            <View style={styles.inputWrapper}>
              <Animated.View
                style={[
                  styles.labelContainer,
                  {
                    opacity: emailLabelAnim,
                    transform: [
                      {
                        translateY: emailLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.inputLabel}>Email</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: emailBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#E0E0E0", "#FF99CC"],
                    }),
                    borderWidth: emailBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ]}
              >
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onSubmitEditing={handleResetPassword}
                />
              </Animated.View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                isLoading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Gửi link đặt lại</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.backToLoginContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF99CC",
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  inputWrapper: {
    marginBottom: 25,
  },
  labelContainer: {
    position: "absolute",
    top: -10,
    left: 15,
    backgroundColor: "#fff",
    paddingHorizontal: 5,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF99CC",
  },
  inputContainer: {
    borderRadius: 15,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  resetButton: {
    backgroundColor: "#FF99CC",
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: "#FF99CC",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  backToLoginText: {
    color: "#FF99CC",
    fontWeight: "bold",
    fontSize: 16,
  },
});
