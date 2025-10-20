/**
 * Utility functions for checking product inventory/stock status
 */

export interface ProductVariant {
  price: number;
  size: string;
  stockQty: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  price?: number | string;
  description?: string;
  category?: string;
  variants?: ProductVariant[];
  [key: string]: any;
}

/**
 * Check if a product is completely out of stock
 * Returns true if ALL variants have stockQty === 0
 * @param product - Product object to check
 * @returns true if product is out of stock, false otherwise
 */
export const isProductOutOfStock = (product: Product): boolean => {
  // If product has no variants, consider it in stock
  if (!product.variants || product.variants.length === 0) {
    return false;
  }

  // Check if ALL variants have stockQty === 0
  return product.variants.every((variant) => variant.stockQty === 0);
};

/**
 * Check if a product has at least one variant in stock
 * @param product - Product object to check
 * @returns true if product has stock, false otherwise
 */
export const hasProductInStock = (product: Product): boolean => {
  return !isProductOutOfStock(product);
};

/**
 * Get total stock quantity across all variants for a product
 * @param product - Product object
 * @returns total stock quantity
 */
export const getTotalProductStock = (product: Product): number => {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }
  return product.variants.reduce(
    (total, variant) => total + variant.stockQty,
    0
  );
};

/**
 * Filter out products that are completely out of stock
 * @param products - Array of products
 * @returns Array of products with in-stock items only
 */
export const filterOutOfStockProducts = (products: Product[]): Product[] => {
  return products.filter((product) => hasProductInStock(product));
};

/**
 * Get the first available variant with stock for a product
 * @param product - Product object
 * @returns First variant with stockQty > 0, or undefined if none available
 */
export const getFirstAvailableVariant = (
  product: Product
): ProductVariant | undefined => {
  if (!product.variants || product.variants.length === 0) {
    return undefined;
  }
  return product.variants.find((variant) => variant.stockQty > 0);
};

/**
 * Get available variants (with stock) for a product
 * @param product - Product object
 * @returns Array of variants with stockQty > 0
 */
export const getAvailableVariants = (product: Product): ProductVariant[] => {
  if (!product.variants || product.variants.length === 0) {
    return [];
  }
  return product.variants.filter((variant) => variant.stockQty > 0);
};
