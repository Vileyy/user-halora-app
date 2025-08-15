// API service để lấy dữ liệu địa chỉ Việt Nam
// Sử dụng API công khai từ provinces.open-api.vn

export interface Province {
  code: string;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
}

export interface District {
  code: string;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  province_code: string;
}

export interface Ward {
  code: string;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  district_code: string;
}

export interface AddressData {
  province: Province | null;
  district: District | null;
  ward: Ward | null;
  detailAddress: string;
}

const BASE_URL = "https://provinces.open-api.vn/api";

class AddressService {
  // Lấy danh sách tất cả tỉnh/thành phố
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${BASE_URL}/p/`);
      if (!response.ok) {
        throw new Error("Failed to fetch provinces");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      throw error;
    }
  }

  // Lấy danh sách quận/huyện theo mã tỉnh
  async getDistricts(provinceCode: string): Promise<District[]> {
    try {
      const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
      if (!response.ok) {
        throw new Error("Failed to fetch districts");
      }
      const data = await response.json();
      return data.districts || [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      throw error;
    }
  }

  // Lấy danh sách phường/xã theo mã quận/huyện
  async getWards(districtCode: string): Promise<Ward[]> {
    try {
      const response = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
      if (!response.ok) {
        throw new Error("Failed to fetch wards");
      }
      const data = await response.json();
      return data.wards || [];
    } catch (error) {
      console.error("Error fetching wards:", error);
      throw error;
    }
  }

  // Format địa chỉ đầy đủ
  formatFullAddress(addressData: AddressData): string {
    const parts = [];

    if (addressData.detailAddress && addressData.detailAddress.trim()) {
      parts.push(addressData.detailAddress.trim());
    }

    if (addressData.ward) {
      parts.push(addressData.ward.full_name || addressData.ward.name || "");
    }

    if (addressData.district) {
      parts.push(
        addressData.district.full_name || addressData.district.name || ""
      );
    }

    if (addressData.province) {
      parts.push(
        addressData.province.full_name || addressData.province.name || ""
      );
    }

    return parts.filter((part) => part.trim()).join(", ");
  }

  // Parse địa chỉ từ string (nếu có sẵn)
  parseAddress(fullAddress: string): Partial<AddressData> {
    // Đây là một implementation cơ bản
    // Trong thực tế có thể cần logic phức tạp hơn
    const parts = fullAddress.split(",").map((part) => part.trim());

    return {
      detailAddress: parts[0] || "",
      // Các phần khác cần được match với dữ liệu từ API
    };
  }
}

export const addressService = new AddressService();
export default addressService;
