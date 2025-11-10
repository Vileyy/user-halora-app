/**
 * Loại bỏ dấu tiếng Việt từ chuỗi
 * Sử dụng normalize("NFD") để tách dấu và regex để loại bỏ
 * Ngắn gọn và hiệu quả hơn so với map từng ký tự
 */
export const removeVietnameseAccents = (str: string): string => {
  if (!str) return "";

  return str
    .normalize("NFD") // Tách dấu khỏi ký tự (ví dụ: "á" thành "a" + "́")
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ tất cả dấu phụ (combining diacritical marks)
    .replace(/đ/g, "d") // Xử lý đặc biệt cho "đ" (không bị normalize)
    .replace(/Đ/g, "D"); // Xử lý đặc biệt cho "Đ"
};

/**
 * Tìm kiếm thông minh không phân biệt dấu và chữ hoa/thường
 * @param text - Text cần tìm kiếm trong
 * @param searchTerm - Từ khóa tìm kiếm
 * @returns true nếu tìm thấy
 */
export const smartSearch = (text: string, searchTerm: string): boolean => {
  if (!text || !searchTerm) return false;

  const normalizedText = removeVietnameseAccents(text.toLowerCase());
  const normalizedSearch = removeVietnameseAccents(searchTerm.toLowerCase());

  return normalizedText.includes(normalizedSearch);
};
