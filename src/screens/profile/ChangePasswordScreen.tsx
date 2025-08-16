import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

interface PasswordRequirementProps {
  text: string;
  isValid: boolean;
}

// Function checking password
const PasswordRequirement = ({ text, isValid }: PasswordRequirementProps) => (
  <View style={styles.requirement}>
    <Ionicons
      name={isValid ? "checkmark-circle" : "close-circle"}
      size={20}
      color={isValid ? "green" : "red"}
    />
    <Text style={{ marginLeft: 5, color: isValid ? "green" : "red" }}>
      {text}
    </Text>
  </View>
);

const ChangePasswordScreen = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const navigation = useNavigation();

  // Checking strong password
  const isLengthValid = newPassword.length >= 8;
  const isUpperCaseValid = /^[A-Z]/.test(newPassword);
  const isSpecialCharValid = /[@#$%^&*!]/.test(newPassword);
  const isNumberValid = /\d/.test(newPassword);
  const isPasswordValid =
    isLengthValid && isUpperCaseValid && isSpecialCharValid && isNumberValid;

  const handleChangePassword = () => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert("Lỗi", "Mật khẩu không đủ mạnh. Vui lòng kiểm tra lại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (!user.email) {
      Alert.alert("Lỗi", "Không tìm thấy email người dùng.");
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    reauthenticateWithCredential(user, credential)
      .then(() => {
        updatePassword(user, newPassword)
          .then(() => {
            Alert.alert("Thành công", "Mật khẩu đã được thay đổi!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
              navigation.goBack();
            }, 1300);
          })
          .catch((error) => {
            Alert.alert("Lỗi", error.message);
          });
      })
      .catch(() => {
        Alert.alert("Lỗi", "Mật khẩu cũ không đúng. Vui lòng thử lại.");
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      {/* Box Card */}
      <View style={styles.card}>
        <Text style={styles.title}>Đổi mật khẩu</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu cũ"
            secureTextEntry={!showOldPassword}
            keyboardType="default"
            autoCapitalize="none"
            value={oldPassword}
            onChangeText={(text) => setOldPassword(removeVietnameseTones(text))}
          />
          <TouchableOpacity
            onPress={() => setShowOldPassword(!showOldPassword)}
          >
            <Ionicons
              name={showOldPassword ? "eye" : "eye-off"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry={!showNewPassword}
            keyboardType="default"
            autoCapitalize="none"
            value={newPassword}
            onChangeText={(text) => setNewPassword(removeVietnameseTones(text))}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons
              name={showNewPassword ? "eye" : "eye-off"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry={!showConfirmPassword}
            keyboardType="default"
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={(text) =>
              setConfirmPassword(removeVietnameseTones(text))
            }
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye" : "eye-off"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordChecklist}>
          <PasswordRequirement text="Ít nhất 8 ký tự" isValid={isLengthValid} />
          <PasswordRequirement
            text="Bắt đầu bằng chữ in hoa"
            isValid={isUpperCaseValid}
          />
          <PasswordRequirement
            text="Có ít nhất một ký tự đặc biệt (@, #, $...)"
            isValid={isSpecialCharValid}
          />
          <PasswordRequirement
            text="Có ít nhất một số"
            isValid={isNumberValid}
          />
        </View>

        {/* Nút Xác nhận */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isPasswordValid ? "#F08080" : "#aaa" },
          ]}
          onPress={handleChangePassword}
          disabled={!isPasswordValid}
        >
          <Text style={styles.buttonText}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  passwordChecklist: {
    marginBottom: 15,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChangePasswordScreen;
