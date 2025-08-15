interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  version: number;
  folder?: string;
}

class CloudinaryService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName =
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    this.apiKey =
      process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || "";
    this.apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || "";
  }


  async uploadAvatar(imageUri: string, userId: string): Promise<string> {
    try {
      if (!this.cloudName) {
        throw new Error("Cloudinary cloud name is not configured");
      }

      const formData = new FormData();

      const filename = `avatar_${userId}_${Date.now()}.jpg`;
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: filename,
      } as any);

      // Sử dụng unsigned upload preset từ Cloudinary dashboard
      formData.append("upload_preset", "my_preset");

      // Thêm folder để organize
      formData.append("folder", `avatars/${userId}`);

      // Thêm tags để dễ quản lý
      formData.append("tags", `avatar,user_${userId}`);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      console.log("Uploading to Cloudinary...", {
        cloudName: this.cloudName,
        folder: `avatars/${userId}`,
        preset: "my_preset",
        url: uploadUrl,
      });

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary upload error:", errorText);
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const data: CloudinaryUploadResponse = await response.json();
      console.log("Cloudinary upload successful:", data.secure_url);

      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async uploadImage(
    imageUri: string,
    folder: string = "general"
  ): Promise<string> {
    try {
      const formData = new FormData();

      const filename = `image_${Date.now()}.jpg`;
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: filename,
      } as any);

      formData.append("upload_preset", "my_preset"); 
      formData.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary image upload error:", error);
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }


// Xóa ảnh từ Cloudinary
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      // Generate timestamp
      const timestamp = Math.floor(Date.now() / 1000);

      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;

      // form data
      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", this.apiKey);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;

      const response = await fetch(deleteUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false;
    }
  }


  extractPublicId(cloudinaryUrl: string): string | null {
    try {
      const regex = /\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp|svg)$/i;
      const match = cloudinaryUrl.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Error extracting public_id:", error);
      return null;
    }
  }

  generateOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
      crop?: string;
      gravity?: string;
    } = {}
  ): string {
    if (!this.cloudName) {
      throw new Error("Cloudinary cloud name is missing");
    }

    const {
      width = 300,
      height = 300,
      quality = "auto:good",
      format = "jpg",
      crop = "fill",
      gravity = "auto",
    } = options;

    const transformations = `w_${width},h_${height},c_${crop},g_${gravity},q_${quality},f_${format}`;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformations}/${publicId}`;
  }


  isConfigured(): boolean {
    return !!(this.cloudName && this.apiKey);
  }

  getConfig() {
    return {
      cloudName: this.cloudName,
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
    };
  }

  async simpleUpload(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: `test_${Date.now()}.jpg`,
      } as any);

      formData.append("upload_preset", "my_preset");

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      console.log("Simple upload test to:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response:", responseText);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${responseText}`);
      }

      const data: CloudinaryUploadResponse = JSON.parse(responseText);
      return data.secure_url;
    } catch (error) {
      console.error("Simple upload error:", error);
      throw error;
    }
  }
}


export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
