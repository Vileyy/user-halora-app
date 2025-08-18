import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  SafeAreaView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, update, onValue } from "firebase/database";
import * as ImagePicker from "expo-image-picker";
import AddressSelector from "../../components/AddressSelector";
import { AddressData } from "../../services/addressService";
import cloudinaryService from "../../services/cloudinaryService";

interface User {
  uid: string;
  email: string;
  phone?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  address?: string; 
  addressData?: AddressData; 
  dateOfBirth?: string;
  gender?: string;
}

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen = ({ navigation }: EditProfileScreenProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
  });

  // Address data state
  const [addressData, setAddressData] = useState<AddressData>({
    province: null,
    district: null,
    ward: null,
    detailAddress: "",
  });

  // Date picker states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs for scroll and inputs
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = ref(database, `users/${currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUser(userData);
          let parsedDate = new Date();
          if (userData.dateOfBirth) {
            const dateParts = userData.dateOfBirth.split("/");
            if (dateParts.length === 3) {
              parsedDate = new Date(
                parseInt(dateParts[2]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[0])
              );
            }
          }
          setSelectedDate(parsedDate);

          setFormData({
            name: userData.displayName || userData.name || "",
            phone: userData.phone || "",
            address: userData.address || "",
            dateOfBirth: userData.dateOfBirth || "",
            gender: userData.gender || "",
          });

          // Load address data
          if (userData.addressData) {
            setAddressData(userData.addressData);
          } else if (userData.address) {
            setAddressData({
              province: null,
              district: null,
              ward: null,
              detailAddress: userData.address,
            });
          }
        }
        setLoading(false);
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        return;
      }

      if (!formData.name.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập họ tên");
        return;
      }

      if (!formData.phone.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
        return;
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        Alert.alert("Lỗi", "Số điện thoại không hợp lệ");
        return;
      }
      const userRef = ref(database, `users/${currentUser.uid}`);
      const { addressService } = await import("../../services/addressService");
      const fullAddress = addressService.formatFullAddress(addressData);

      const updateData = {
        displayName: formData.name,
        phone: formData.phone,
        address: fullAddress,
        addressData: addressData,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        updatedAt: new Date().toISOString(),
      };

      await update(userRef, updateData);

      Alert.alert("Thành công", "Cập nhật thông tin thành công", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Lỗi",
          "Cần quyền truy cập thư viện ảnh để thay đổi avatar"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi chọn ảnh");
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        return;
      }

      // Kiểm tra cấu hình Cloudinary
      if (!cloudinaryService.isConfigured()) {
        Alert.alert("Lỗi", "Cấu hình Cloudinary chưa đầy đủ");
        console.error("Cloudinary config:", cloudinaryService.getConfig());
        return;
      }
      // Upload avatar lên Cloudinary
      let cloudinaryUrl: string;

      try {
        cloudinaryUrl = await cloudinaryService.uploadAvatar(
          imageUri,
          currentUser.uid
        );
      } catch (uploadError) {
        console.log("Upload avatar failed, trying simple upload:", uploadError);
        cloudinaryUrl = await cloudinaryService.simpleUpload(imageUri);
      }

      // Cập nhật Firebase Realtime Database với URL mới
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, {
        avatar: cloudinaryUrl,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Thành công", "Cập nhật avatar thành công");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải ảnh lên";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const getAvatarInitials = () => {
    if (formData.name) {
      return formData.name.charAt(0).toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      const namePart = user.email.split("@")[0];
      return namePart.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Auto scroll when input is focused
  const handleInputFocus = (inputPosition: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: inputPosition,
        animated: true,
      });
    }, 100);
  };

  // Handle next field navigation
  const handleSubmitEditing = (
    nextInputRef?: React.RefObject<TextInput | null>
  ) => {
    if (nextInputRef?.current) {
      nextInputRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  // Date picker handlers
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const formattedDate = formatDate(date);
      setFormData((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B7D" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleImagePicker}
            disabled={uploadingImage}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getAvatarInitials()}</Text>
              </View>
            )}

            {uploadingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Nhấn để thay đổi ảnh đại diện</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Họ và tên *</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              returnKeyType="next"
              onFocus={() => handleInputFocus(200)}
              onSubmitEditing={() => handleSubmitEditing(phoneInputRef)}
              blurOnSubmit={false}
            />
          </View>

          {/* Email Field (Read only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={user?.email || ""}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#999"
            />
            <Text style={styles.readOnlyHint}>Email không thể thay đổi</Text>
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Số điện thoại *</Text>
            <TextInput
              ref={phoneInputRef}
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, phone: text }))
              }
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              returnKeyType="next"
              onFocus={() => handleInputFocus(350)}
              onSubmitEditing={() => handleSubmitEditing()}
              blurOnSubmit={false}
            />
          </View>

          {/* Address Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Địa chỉ</Text>
            <AddressSelector
              value={addressData}
              onChange={setAddressData}
              placeholder="Chọn địa chỉ"
            />
          </View>

          {/* Date of Birth Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ngày sinh</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={styles.datePickerText}>
                {formData.dateOfBirth || "Chọn ngày sinh"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Gender Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Giới tính</Text>
            <View style={styles.genderContainer}>
              {[
                { label: "Nam", value: "male" },
                { label: "Nữ", value: "female" },
                { label: "Khác", value: "other" },
              ].map((genderOption) => (
                <TouchableOpacity
                  key={genderOption.value}
                  style={[
                    styles.genderOption,
                    formData.gender === genderOption.value &&
                      styles.selectedGender,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: genderOption.value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === genderOption.value &&
                        styles.selectedGenderText,
                    ]}
                  >
                    {genderOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          style={Platform.OS === "ios" ? styles.iosDatePicker : undefined}
        />
      )}

      {/* Date Picker Modal */}
      {Platform.OS === "ios" && showDatePicker && (
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={hideDatePicker}>
                <Text style={styles.datePickerCancelButton}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
              <TouchableOpacity onPress={hideDatePicker}>
                <Text style={styles.datePickerDoneButton}>Xong</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              style={styles.iosDatePicker}
            />
          </View>
        </View>
      )}

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.savingButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#b8860b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B7D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  readOnlyHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  selectedGender: {
    backgroundColor: "#FF6B7D",
    borderColor: "#FF6B7D",
  },
  genderText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  selectedGenderText: {
    color: "#fff",
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#FF6B7D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  savingButton: {
    backgroundColor: "#FF8A9B",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  datePickerModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  datePickerCancelButton: {
    fontSize: 16,
    color: "#666",
  },
  datePickerDoneButton: {
    fontSize: 16,
    color: "#FF6B7D",
    fontWeight: "bold",
  },
  iosDatePicker: {
    height: 200,
  },
});

export default EditProfileScreen;
