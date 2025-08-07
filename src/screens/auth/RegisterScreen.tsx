import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setEmail, setPassword, setError } from "../../redux/slices/authSlice";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../../services/firebase";
import { RootStackParamList } from "../../types/navigation";
import { StackNavigationProp } from "@react-navigation/stack";
import Toast from "react-native-toast-message";

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RegisterScreen"
>;

export default function RegisterScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const { email, password, error } = useSelector(
    (state: RootState) => state.auth
  );

  // Local state for register form
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Animated values
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const phoneLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordLabelAnim = useRef(new Animated.Value(0)).current;

  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const phoneBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordBorderAnim = useRef(new Animated.Value(0)).current;

  // Animate email label
  useEffect(() => {
    Animated.timing(emailLabelAnim, {
      toValue: emailFocused || email.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, email.length]);

  // Animate phone label
  useEffect(() => {
    Animated.timing(phoneLabelAnim, {
      toValue: phoneFocused || phone.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [phoneFocused, phone.length]);

  // Animate password label
  useEffect(() => {
    Animated.timing(passwordLabelAnim, {
      toValue: passwordFocused || password.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, password.length]);

  // Animate confirm password label
  useEffect(() => {
    Animated.timing(confirmPasswordLabelAnim, {
      toValue: confirmPasswordFocused || confirmPassword.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmPasswordFocused, confirmPassword.length]);

  // Animate borders
  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  useEffect(() => {
    Animated.timing(phoneBorderAnim, {
      toValue: phoneFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [phoneFocused]);

  useEffect(() => {
    Animated.timing(passwordBorderAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused]);

  useEffect(() => {
    Animated.timing(confirmPasswordBorderAnim, {
      toValue: confirmPasswordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmPasswordFocused]);

  const handleRegister = async () => {
    // Validation
    if (!email.includes("@")) {
      dispatch(setError("Email không hợp lệ"));
      return;
    }

    if (phone.length < 10) {
      dispatch(setError("Số điện thoại không hợp lệ"));
      return;
    }

    if (password.length < 6) {
      dispatch(setError("Mật khẩu phải từ 6 ký tự trở lên"));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(setError("Mật khẩu xác nhận không khớp"));
      return;
    }

    dispatch(setError(null));
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Đăng ký thành công", userCredential.user);

      // Lưu thông tin user vào Realtime Database
      const userData = {
        uid: userCredential.user.uid,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Lưu vào nhánh "users" với UID làm key
      await set(ref(database, `users/${userCredential.user.uid}`), userData);
      console.log("Đã lưu thông tin user vào database");

      // Hiển thị thông báo thành công
      Toast.show({
        type: "success",
        text1: "Đăng ký thành công!",
        text2: "Tài khoản đã được tạo thành công",
        position: "top",
        visibilityTime: 3000,
      });

      // Chuyển về trang Login sau 2 giây
      setTimeout(() => {
        navigation.navigate("LoginScreen");
      }, 2000);
    } catch (error: any) {
      console.log("Đăng ký thất bại", error);

      // Hiển thị thông báo lỗi
      Toast.show({
        type: "error",
        text1: "Đăng ký thất bại!",
        text2: error.message || "Có lỗi xảy ra khi đăng ký",
        position: "top",
        visibilityTime: 4000,
      });

      dispatch(setError("Đăng ký thất bại"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF99CC" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/image/Logo_Halora.png")}
            style={styles.logoImage}
          />
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.registerTitle}>Register Halora Comestic</Text>

          <View style={styles.inputContainer}>
            {/* Email Input */}
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
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => dispatch(setEmail(text))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </Animated.View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <Animated.View
                style={[
                  styles.labelContainer,
                  {
                    opacity: phoneLabelAnim,
                    transform: [
                      {
                        translateY: phoneLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.inputLabel}>Số điện thoại</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: phoneBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#E0E0E0", "#FF99CC"],
                    }),
                    borderWidth: phoneBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Số điện thoại"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                />
              </Animated.View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Animated.View
                style={[
                  styles.labelContainer,
                  {
                    opacity: passwordLabelAnim,
                    transform: [
                      {
                        translateY: passwordLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.inputLabel}>Mật khẩu</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: passwordBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#E0E0E0", "#FF99CC"],
                    }),
                    borderWidth: passwordBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ]}
              >
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Mật khẩu"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(text) => dispatch(setPassword(text))}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Animated.View
                style={[
                  styles.labelContainer,
                  {
                    opacity: confirmPasswordLabelAnim,
                    transform: [
                      {
                        translateY: confirmPasswordLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: confirmPasswordBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#E0E0E0", "#FF99CC"],
                    }),
                    borderWidth: confirmPasswordBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ]}
              >
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>Đăng ký</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("LoginScreen")}
            >
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF99CC",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 25,
  },
  registerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 10,
    borderRadius: 15,
  },
  inputWrapper: {
    marginBottom: 20,
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
  input: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  registerButton: {
    backgroundColor: "#FF99CC",
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 20,
    marginTop: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "#FF0000",
    textAlign: "center",
    marginBottom: 15,
  },
  loginContainer: {
    flexDirection: "row", // ← xếp ngang
    justifyContent: "center", // ← căn giữa
    alignItems: "center",
    marginTop: 20,
  },

  loginText: {
    fontSize: 16,
    color: "#666",
  },
  loginLink: {
    color: "#FF99CC",
    fontWeight: "bold",
    marginLeft: 5,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  eyeIcon: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  eyeIconText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
});
