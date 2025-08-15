import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import addressService, {
  Province,
  District,
  Ward,
  AddressData,
} from "../services/addressService";

interface AddressSelectorProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  placeholder?: string;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  value,
  onChange,
  placeholder = "Chọn địa chỉ",
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "province" | "district" | "ward" | "detail"
  >("province");

  // Data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Search states
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [detailAddress, setDetailAddress] = useState(value.detailAddress || "");

  // Selected items
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    value.province
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    value.district
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(value.ward);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    setDetailAddress(value.detailAddress || "");
    setSelectedProvince(value.province);
    setSelectedDistrict(value.district);
    setSelectedWard(value.ward);
  }, [value]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const provincesData = await addressService.getProvinces();
      setProvinces(provincesData);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách tỉnh/thành phố");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceCode: string) => {
    try {
      setLoadingDistricts(true);
      const districtsData = await addressService.getDistricts(provinceCode);
      setDistricts(districtsData);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách quận/huyện");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWards = async (districtCode: string) => {
    try {
      setLoadingWards(true);
      const wardsData = await addressService.getWards(districtCode);
      setWards(wardsData);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách phường/xã");
    } finally {
      setLoadingWards(false);
    }
  };

  const handleProvinceSelect = async (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setCurrentStep("district");
    await loadDistricts(province.code);
  };

  const handleDistrictSelect = async (district: District) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    setCurrentStep("ward");
    await loadWards(district.code);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    setCurrentStep("detail");
  };

  const handleSave = () => {
    const addressData: AddressData = {
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard,
      detailAddress: detailAddress,
    };

    onChange(addressData);
    setIsModalVisible(false);
  };

  const handleClose = () => {
    // Reset về giá trị ban đầu
    setSelectedProvince(value.province);
    setSelectedDistrict(value.district);
    setSelectedWard(value.ward);
    setDetailAddress(value.detailAddress || "");
    setCurrentStep("province");
    setIsModalVisible(false);
  };

  const getDisplayText = () => {
    if (value.province || value.district || value.ward || value.detailAddress) {
      return addressService.formatFullAddress(value);
    }
    return placeholder;
  };

  const filteredProvinces = provinces.filter(
    (province) =>
      (province.full_name &&
        province.full_name
          .toLowerCase()
          .includes(provinceSearch.toLowerCase())) ||
      (province.name &&
        province.name.toLowerCase().includes(provinceSearch.toLowerCase()))
  );

  const filteredDistricts = districts.filter(
    (district) =>
      (district.full_name &&
        district.full_name
          .toLowerCase()
          .includes(districtSearch.toLowerCase())) ||
      (district.name &&
        district.name.toLowerCase().includes(districtSearch.toLowerCase()))
  );

  const filteredWards = wards.filter(
    (ward) =>
      (ward.full_name &&
        ward.full_name.toLowerCase().includes(wardSearch.toLowerCase())) ||
      (ward.name && ward.name.toLowerCase().includes(wardSearch.toLowerCase()))
  );

  const renderStepHeader = () => {
    const steps = [
      { key: "province", title: "Tỉnh/TP", completed: !!selectedProvince },
      { key: "district", title: "Quận/Huyện", completed: !!selectedDistrict },
      { key: "ward", title: "Phường/Xã", completed: !!selectedWard },
      { key: "detail", title: "Chi tiết", completed: !!detailAddress.trim() },
    ];

    return (
      <View style={styles.stepHeader}>
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <TouchableOpacity
              style={[
                styles.stepItem,
                currentStep === step.key && styles.stepItemActive,
                step.completed && styles.stepItemCompleted,
              ]}
              onPress={() => {
                if (
                  step.key === "province" ||
                  (step.key === "district" && selectedProvince) ||
                  (step.key === "ward" && selectedDistrict) ||
                  (step.key === "detail" && selectedWard)
                ) {
                  setCurrentStep(step.key as any);
                }
              }}
            >
              <Text
                style={[
                  styles.stepText,
                  currentStep === step.key && styles.stepTextActive,
                  step.completed && styles.stepTextCompleted,
                ]}
              >
                {step.title}
              </Text>
            </TouchableOpacity>
            {index < steps.length - 1 && <View style={styles.stepSeparator} />}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderProvinceStep = () => (
    <View style={styles.stepContent}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm tỉnh/thành phố..."
        value={provinceSearch}
        onChangeText={setProvinceSearch}
      />
      {loadingProvinces ? (
        <ActivityIndicator size="large" color="#FF6B7D" style={styles.loader} />
      ) : (
        <ScrollView style={styles.listContainer}>
          {filteredProvinces.map((province) => (
            <TouchableOpacity
              key={province.code}
              style={[
                styles.listItem,
                selectedProvince?.code === province.code &&
                  styles.listItemSelected,
              ]}
              onPress={() => handleProvinceSelect(province)}
            >
              <Text
                style={[
                  styles.listItemText,
                  selectedProvince?.code === province.code &&
                    styles.listItemTextSelected,
                ]}
              >
                {province.full_name || province.name || "Tên không xác định"}
              </Text>
              {selectedProvince?.code === province.code && (
                <Ionicons name="checkmark" size={20} color="#FF6B7D" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderDistrictStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.selectedInfo}>
        Tỉnh/TP:{" "}
        {selectedProvince?.full_name || selectedProvince?.name || "Chưa chọn"}
      </Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm quận/huyện..."
        value={districtSearch}
        onChangeText={setDistrictSearch}
      />
      {loadingDistricts ? (
        <ActivityIndicator size="large" color="#FF6B7D" style={styles.loader} />
      ) : (
        <ScrollView style={styles.listContainer}>
          {filteredDistricts.map((district) => (
            <TouchableOpacity
              key={district.code}
              style={[
                styles.listItem,
                selectedDistrict?.code === district.code &&
                  styles.listItemSelected,
              ]}
              onPress={() => handleDistrictSelect(district)}
            >
              <Text
                style={[
                  styles.listItemText,
                  selectedDistrict?.code === district.code &&
                    styles.listItemTextSelected,
                ]}
              >
                {district.full_name || district.name || "Tên không xác định"}
              </Text>
              {selectedDistrict?.code === district.code && (
                <Ionicons name="checkmark" size={20} color="#FF6B7D" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderWardStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.selectedInfo}>
        {selectedProvince?.full_name || selectedProvince?.name || "Chưa chọn"} •{" "}
        {selectedDistrict?.full_name || selectedDistrict?.name || "Chưa chọn"}
      </Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm phường/xã..."
        value={wardSearch}
        onChangeText={setWardSearch}
      />
      {loadingWards ? (
        <ActivityIndicator size="large" color="#FF6B7D" style={styles.loader} />
      ) : (
        <ScrollView style={styles.listContainer}>
          {filteredWards.map((ward) => (
            <TouchableOpacity
              key={ward.code}
              style={[
                styles.listItem,
                selectedWard?.code === ward.code && styles.listItemSelected,
              ]}
              onPress={() => handleWardSelect(ward)}
            >
              <Text
                style={[
                  styles.listItemText,
                  selectedWard?.code === ward.code &&
                    styles.listItemTextSelected,
                ]}
              >
                {ward.full_name || ward.name || "Tên không xác định"}
              </Text>
              {selectedWard?.code === ward.code && (
                <Ionicons name="checkmark" size={20} color="#FF6B7D" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderDetailStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.selectedInfo}>
        {selectedProvince?.full_name || selectedProvince?.name || "Chưa chọn"} •{" "}
        {selectedDistrict?.full_name || selectedDistrict?.name || "Chưa chọn"} •{" "}
        {selectedWard?.full_name || selectedWard?.name || "Chưa chọn"}
      </Text>
      <Text style={styles.detailLabel}>Địa chỉ chi tiết</Text>
      <TextInput
        style={styles.detailInput}
        placeholder="Số nhà, tên đường..."
        value={detailAddress}
        onChangeText={setDetailAddress}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "province":
        return renderProvinceStep();
      case "district":
        return renderDistrictStep();
      case "ward":
        return renderWardStep();
      case "detail":
        return renderDetailStep();
      default:
        return renderProvinceStep();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsModalVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !getDisplayText() || getDisplayText() === placeholder
              ? styles.placeholder
              : null,
          ]}
          numberOfLines={2}
        >
          {getDisplayText()}
        </Text>
        <Ionicons name="location-outline" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!selectedProvince || !selectedDistrict || !selectedWard}
            >
              <Text
                style={[
                  styles.saveButton,
                  (!selectedProvince || !selectedDistrict || !selectedWard) &&
                    styles.saveButtonDisabled,
                ]}
              >
                Lưu
              </Text>
            </TouchableOpacity>
          </View>

          {renderStepHeader()}
          {renderCurrentStep()}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 50,
  },
  selectorText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  placeholder: {
    color: "#999",
  },
  modal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    fontSize: 16,
    color: "#FF6B7D",
    fontWeight: "bold",
  },
  saveButtonDisabled: {
    color: "#ccc",
  },
  stepHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  stepItemActive: {
    backgroundColor: "#FF6B7D",
    borderRadius: 8,
  },
  stepItemCompleted: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  stepText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  stepTextActive: {
    color: "#fff",
  },
  stepTextCompleted: {
    color: "#fff",
  },
  stepSeparator: {
    width: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  selectedInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    fontWeight: "500",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listItemSelected: {
    backgroundColor: "#FFF5F6",
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  listItemTextSelected: {
    color: "#FF6B7D",
    fontWeight: "500",
  },
  loader: {
    marginTop: 50,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    height: 80,
    textAlignVertical: "top",
  },
});

export default AddressSelector;
