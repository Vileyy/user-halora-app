// Test Cloudinary upload với preset my_preset

import cloudinaryService from "../services/cloudinaryService";

// Test với base64 image nhỏ
export const testCloudinarySetup = async () => {
  console.log("=== TESTING CLOUDINARY SETUP ===");

  // Kiểm tra config
  console.log("Config:", cloudinaryService.getConfig());

  // Tạo test image (1x1 pixel PNG)
  const testImageBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  try {
    console.log("Testing simple upload...");
    const result = await cloudinaryService.simpleUpload(testImageBase64);
    console.log("✅ Test upload successful!");
    console.log("URL:", result);
    return result;
  } catch (error) {
    console.error("❌ Test upload failed:", error);
    throw error;
  }
};

// Test direct upload với fetch
export const testDirectUpload = async () => {
  try {
    console.log("=== TESTING DIRECT UPLOAD ===");

    const testImageBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const formData = new FormData();
    formData.append("file", testImageBase64);
    formData.append("upload_preset", "my_preset");

    const uploadUrl = "https://api.cloudinary.com/v1_1/de8vufzzx/image/upload";

    console.log("Direct upload to:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log("✅ Direct upload successful!");
      return data.secure_url;
    } else {
      console.error("❌ Direct upload failed");
      throw new Error(
        `Direct upload failed: ${response.status} - ${responseText}`
      );
    }
  } catch (error) {
    console.error("❌ Direct upload error:", error);
    throw error;
  }
};
