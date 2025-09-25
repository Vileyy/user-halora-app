import { database } from "./firebase";
import { ref, onValue, off, update, get } from "firebase/database";

export interface VoucherData {
  id: string;
  code: string;
  title: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number;
  startDate: number;
  endDate: number;
  status: "active" | "inactive";
  type: "shipping" | "product";
  usageCount: number;
  usageLimit: number;
  createdAt: number;
  updatedAt: number;
}

export class VoucherService {
  private static instance: VoucherService;
  private vouchersRef = ref(database, "vouchers");

  public static getInstance(): VoucherService {
    if (!VoucherService.instance) {
      VoucherService.instance = new VoucherService();
    }
    return VoucherService.instance;
  }

  /**
   * Lấy danh sách vouchers theo thời gian thực
   */
  public subscribeToVouchers(
    callback: (vouchers: VoucherData[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const unsubscribe = onValue(
      this.vouchersRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const vouchers: VoucherData[] = [];

          if (data) {
            Object.entries(data).forEach(([key, value]: [string, any]) => {
              vouchers.push({
                id: key,
                code: value.code,
                title: value.title,
                discountType: value.discountType,
                discountValue: value.discountValue,
                minOrder: value.minOrder,
                startDate: value.startDate,
                endDate: value.endDate,
                status: value.status,
                type: value.type,
                usageCount: value.usageCount || 0,
                usageLimit: value.usageLimit,
                createdAt: value.createdAt,
                updatedAt: value.updatedAt,
              });
            });
          }

          // Sắp xếp vouchers: active trước, theo ngày tạo mới nhất
          vouchers.sort((a, b) => {
            if (a.status !== b.status) {
              return a.status === "active" ? -1 : 1;
            }
            return b.createdAt - a.createdAt;
          });

          callback(vouchers);
        } catch (error) {
          console.error("Error parsing vouchers data:", error);
          if (errorCallback) {
            errorCallback(error as Error);
          }
        }
      },
      (error) => {
        console.error("Error fetching vouchers:", error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );

    // Trả về function để unsubscribe
    return () => off(this.vouchersRef, "value", unsubscribe);
  }

  /**
   * Lọc vouchers theo loại
   */
  public filterVouchersByType(
    vouchers: VoucherData[],
    type: "shipping" | "product"
  ): VoucherData[] {
    return vouchers.filter((voucher) => voucher.type === type);
  }

  /**
   * Lọc vouchers có thể sử dụng
   */
  public getUsableVouchers(
    vouchers: VoucherData[],
    currentTotal: number = 0
  ): VoucherData[] {
    const now = new Date().getTime();

    return vouchers.filter((voucher) => {
      // Kiểm tra status
      if (voucher.status !== "active") return false;

      // Kiểm tra thời hạn
      if (now < voucher.startDate || now > voucher.endDate) return false;

      // Kiểm tra số lượt sử dụng
      if (voucher.usageCount >= voucher.usageLimit) return false;

      // Kiểm tra đơn tối thiểu
      if (currentTotal > 0 && currentTotal < voucher.minOrder) return false;

      return true;
    });
  }

  /**
   * Tính toán số tiền được giảm
   */
  public calculateDiscount(
    voucher: VoucherData,
    orderTotal: number,
    shippingFee: number = 0
  ): number {
    if (voucher.type === "shipping") {
      if (voucher.discountType === "percentage") {
        return Math.min(
          shippingFee * (voucher.discountValue / 100),
          shippingFee
        );
      } else {
        return Math.min(voucher.discountValue, shippingFee);
      }
    } else {
      // Product voucher
      if (voucher.discountType === "percentage") {
        return orderTotal * (voucher.discountValue / 100);
      } else {
        return voucher.discountValue;
      }
    }
  }

  /**
   * Kiểm tra voucher có hợp lệ không
   */
  public isVoucherValid(
    voucher: VoucherData,
    currentTotal: number = 0
  ): {
    valid: boolean;
    reason?: string;
  } {
    const now = new Date().getTime();

    if (voucher.status !== "active") {
      return { valid: false, reason: "Voucher không hoạt động" };
    }

    if (now < voucher.startDate) {
      return { valid: false, reason: "Voucher chưa có hiệu lực" };
    }

    if (now > voucher.endDate) {
      return { valid: false, reason: "Voucher đã hết hạn" };
    }

    if (voucher.usageCount >= voucher.usageLimit) {
      return { valid: false, reason: "Voucher đã hết lượt sử dụng" };
    }

    if (currentTotal > 0 && currentTotal < voucher.minOrder) {
      return {
        valid: false,
        reason: `Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString()}₫`,
      };
    }

    return { valid: true };
  }

  /**
   * Cập nhật usage count của voucher sau khi sử dụng
   */
  public async updateVoucherUsage(voucherId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const voucherRef = ref(database, `vouchers/${voucherId}`);
      const snapshot = await get(voucherRef);

      if (!snapshot.exists()) {
        return { success: false, message: "Voucher không tồn tại" };
      }

      const voucherData = snapshot.val();
      const currentUsage = voucherData.usageCount || 0;
      const newUsage = currentUsage + 1;

      // Kiểm tra xem có vượt quá giới hạn không
      if (newUsage > voucherData.usageLimit) {
        return { success: false, message: "Voucher đã hết lượt sử dụng" };
      }

      // Cập nhật usage count
      await update(voucherRef, {
        usageCount: newUsage,
        updatedAt: new Date().getTime(),
      });

      // console.log(
      //   `✅ Voucher ${voucherData.code} usage updated: ${newUsage}/${voucherData.usageLimit}`
      // );

      return { success: true, message: "Cập nhật voucher thành công" };
    } catch (error) {
      console.error("Error updating voucher usage:", error);
      return { success: false, message: "Không thể cập nhật voucher" };
    }
  }

  /**
   * Cập nhật usage count cho nhiều voucher cùng lúc
   */
  public async updateMultipleVoucherUsage(voucherIds: string[]): Promise<{
    success: boolean;
    message: string;
    results: Array<{ voucherId: string; success: boolean; message: string }>;
  }> {
    const results: Array<{
      voucherId: string;
      success: boolean;
      message: string;
    }> = [];
    let allSuccess = true;

    for (const voucherId of voucherIds) {
      const result = await this.updateVoucherUsage(voucherId);
      results.push({
        voucherId,
        success: result.success,
        message: result.message,
      });

      if (!result.success) {
        allSuccess = false;
      }
    }

    return {
      success: allSuccess,
      message: allSuccess
        ? "Tất cả voucher đã được cập nhật"
        : "Một số voucher không thể cập nhật",
      results,
    };
  }
}

export default VoucherService.getInstance();
