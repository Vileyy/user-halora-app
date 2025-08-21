interface UserInfo {
  displayName?: string;
  name?: string;
  phone?: string;
  address?: string;
  provider?: string;
  addressData?: {
    province: any;
    district: any;
    ward: any;
    detailAddress: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  messages: string[];
}

/**
 * Kiểm tra xem thông tin người dùng đã đầy đủ để đặt hàng chưa
 * @param user - Thông tin người dùng cần kiểm tra
 * @returns Kết quả validation với danh sách trường thiếu
 */
export const validateUserForOrder = (
  user: UserInfo | null
): ValidationResult => {
  const missingFields: string[] = [];
  const messages: string[] = [];

  if (!user) {
    return {
      isValid: false,
      missingFields: ["user"],
      messages: ["Vui lòng đăng nhập để tiếp tục"],
    };
  }

  // Kiểm tra tên - chỉ check nếu chưa có (user đăng ký thường)
  const isGoogleUser = user.provider === "google";
  const hasDisplayName = user.displayName?.trim();
  const hasName = user.name?.trim();
  const hasValidName = hasDisplayName || hasName;

  // Debug log để kiểm tra tên
  console.log("Name validation debug:", {
    provider: user.provider,
    isGoogleUser,
    displayName: user.displayName,
    name: user.name,
    hasDisplayName,
    hasName,
    hasValidName,
    willSkipNameCheck: isGoogleUser && hasDisplayName,
  });

  // Nếu là Google user và đã có displayName thì bỏ qua check tên
  if (!isGoogleUser && !hasValidName) {
    missingFields.push("name");
    messages.push("Họ và tên");
  }

  // Luôn kiểm tra số điện thoại (bắt buộc)
  if (!user.phone?.trim()) {
    missingFields.push("phone");
    messages.push("Số điện thoại");
  } else {
    // Validate phone format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(user.phone.replace(/\s/g, ""))) {
      missingFields.push("phone");
      messages.push("Số điện thoại hợp lệ");
    }
  }

  // Luôn kiểm tra địa chỉ (bắt buộc)
  const hasAddress =
    (user.address && user.address.trim().length > 0) ||
    (user.addressData?.province &&
      user.addressData?.district &&
      user.addressData?.ward &&
      user.addressData?.detailAddress &&
      user.addressData.detailAddress.trim().length > 0);

  // Debug log để kiểm tra
  console.log("Address validation debug:", {
    address: user.address,
    addressLength: user.address?.length,
    addressData: user.addressData,
    hasAddress,
    finalValidation: hasAddress,
  });

  if (!hasAddress) {
    missingFields.push("address");
    messages.push("Địa chỉ giao hàng");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    messages,
  };
};

/**
 * Tạo message thông báo cho user về thông tin còn thiếu
 * @param validationResult - Kết quả validation
 * @returns Message string để hiển thị
 */
export const createValidationMessage = (
  validationResult: ValidationResult
): string => {
  if (validationResult.isValid) {
    return "";
  }

  if (validationResult.messages.length === 1) {
    return `Vui lòng cập nhật ${validationResult.messages[0]} để có thể đặt hàng.`;
  }

  if (validationResult.messages.length === 2) {
    return `Vui lòng cập nhật ${validationResult.messages[0]} và ${validationResult.messages[1]} để có thể đặt hàng.`;
  }

  const lastMessage = validationResult.messages.pop();
  return `Vui lòng cập nhật ${validationResult.messages.join(
    ", "
  )} và ${lastMessage} để có thể đặt hàng.`;
};
