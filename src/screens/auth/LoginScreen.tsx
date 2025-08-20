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
  ActivityIndicator,
} from "react-native";
// @ts-ignore
import Icon from "react-native-vector-icons/FontAwesome";
// @ts-ignore
import AntDesign from "react-native-vector-icons/AntDesign";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setEmail,
  setPassword,
  setError,
  setUser,
  setGoogleSigningIn,
} from "../../redux/slices/authSlice";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, database } from "../../services/firebase";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { RootStackParamList } from "../../types/navigation";
import { StackNavigationProp } from "@react-navigation/stack";
import Toast from "react-native-toast-message";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { email, password, error, isGoogleSigningIn } = useSelector(
    (state: RootState) => state.auth
  );

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animated values
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  // Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "1029103419885-dv28mm1cepi33c4vgpabfn2s0o1sbb7v.apps.googleusercontent.com",
      forceCodeForRefreshToken: true, 
    });
  }, []);

  // Animate email label
  useEffect(() => {
    Animated.timing(emailLabelAnim, {
      toValue: emailFocused || email.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, email.length]);

  // Animate password label
  useEffect(() => {
    Animated.timing(passwordLabelAnim, {
      toValue: passwordFocused || password.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, password.length]);

  // Animate email border
  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  // Animate password border
  useEffect(() => {
    Animated.timing(passwordBorderAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused]);

  const handleLogin = async () => {
    if (!email.includes("@")) {
      Toast.show({
        type: "error",
        text1: "Lỗi!",
        text2: "Email không hợp lệ",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Lỗi!",
        text2: "Mật khẩu phải từ 6 ký tự trở lên",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);
    dispatch(setError(null));

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Đăng nhập thành công", userCredential.user);
      try {
        const userRef = ref(database, `users/${userCredential.user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          // console.log("Thông tin user từ database:", userData);
          // Lưu thông tin user vào Redux state
          dispatch(setUser(userData));
        }
      } catch (dbError) {
        console.log("Lỗi khi lấy thông tin user từ database:", dbError);
      }

      // Delay 1 giây để hiển thị loading
      setTimeout(() => {
        setIsLoading(false);
        Toast.show({
          type: "success",
          text1: "Đăng nhập thành công!",
          text2: "Chào mừng bạn trở lại",
          position: "top",
          visibilityTime: 3000,
        });

        navigation.navigate("MainTabs");
      }, 1000);
    } catch (error: any) {
      console.log("Đăng nhập thất bại", error);
      setIsLoading(false);

      // Hiển thị thông báo lỗi
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại!",
        text2: error.message || "Email hoặc mật khẩu không đúng",
        position: "top",
        visibilityTime: 4000,
      });

      dispatch(setError("Đăng nhập thất bại"));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      dispatch(setGoogleSigningIn(true));
      dispatch(setError(null));

      // Check service Google Play
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn({
        loginHint: "", 
      });

      if (userInfo.data?.idToken) {
        const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        console.log("✅ Login thành công:", firebaseUser);

        // Chuẩn bị dữ liệu user
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          provider: "google",
          phone: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Kiểm tra xem user đã tồn tại trong database 
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
          await set(userRef, userData);
        } else {
          const existingData = snapshot.val();
          const updatedData = {
            ...existingData,
            displayName: firebaseUser.displayName || existingData.displayName,
            photoURL: firebaseUser.photoURL || existingData.photoURL,
            updatedAt: new Date().toISOString(),
          };
          await set(userRef, updatedData);
          userData.phone = existingData.phone || "";
          userData.createdAt = existingData.createdAt;
        }

        // Lưu thông tin user vào Redux state
        dispatch(setUser(userData));

        dispatch(setGoogleSigningIn(false));

        Toast.show({
          type: "success",
          text1: "Đăng nhập Google thành công!",
          text2: `Chào mừng ${userData.displayName || userData.email}`,
          position: "top",
          visibilityTime: 3000,
        });

        navigation.navigate("MainTabs");
      }
    } catch (error: any) {
      dispatch(setGoogleSigningIn(false));
      console.error("❌ Lỗi đăng nhập:", error);

      Toast.show({
        type: "error",
        text1: "Lỗi đăng nhập Google!",
        text2: error.message || "Đăng nhập thất bại",
        position: "top",
        visibilityTime: 4000,
      });

      dispatch(setError(error.message));
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
          <Text style={styles.loginTitle}>Login Halora Comestic</Text>

          <View style={styles.inputContainer}>
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password ?</Text>
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                activeOpacity={0.8}
                onPress={handleGoogleSignIn}
                disabled={isGoogleSigningIn}
              >
                {isGoogleSigningIn ? (
                  <ActivityIndicator color="#DB4437" size="small" />
                ) : (
                  <Icon name="google" size={24} color="#DB4437" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                activeOpacity={0.8}
              >
                <Icon name="facebook" size={24} color="#4267B2" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                activeOpacity={0.8}
              >
                <AntDesign name="apple1" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("RegisterScreen")}
            >
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  statusIcons: {
    flexDirection: "row",
    gap: 8,
  },
  statusIcon: {
    fontSize: 14,
    color: "#fff",
  },
  navBar: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 24,
    marginRight: 8,
    color: "#fff",
  },
  backText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
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
  logoIcon: {
    fontSize: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 14,
    color: "#666",
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 25,
  },
  loginTitle: {
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -10,
  },
  forgotPasswordText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  socialContainer: {
    marginBottom: 30,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  orText: {
    marginHorizontal: 15,
    color: "#333",
    fontSize: 16,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 25,
    marginTop: 5,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButton: {
    borderColor: "#DB4437",
    shadowColor: "#DB4437",
  },
  facebookButton: {
    borderColor: "#4267B2",
    shadowColor: "#4267B2",
  },
  appleButton: {
    borderColor: "#000",
    shadowColor: "#000",
  },
  loginButton: {
    backgroundColor: "#FF99CC",
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: "#666",
  },
  registerLink: {
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
