/**
 * Test utility for inventory management
 * This file demonstrates how the inventory system works
 */

import {
  checkProductStock,
  updateProductStock,
  placeOrder,
  cancelOrder,
} from "../services/orderService";

/**
 * Test inventory management with a sample product
 */
export const testInventoryManagement = async () => {
  const testProductId = "-OZEKNi8jt8oSgzpBmPU"; // Sample product from your DB
  const testVariantSize = "50"; // 50ml variant
  const testUserId = "test-user-123";

  // console.log("🧪 Testing Inventory Management System");
  // console.log("=====================================");

  try {
    // Test 1: Check initial stock
    // console.log("📦 Test 1: Checking initial stock");
    const initialStock = await checkProductStock(
      testProductId,
      testVariantSize,
      1
    );
    // console.log("Initial stock check:", initialStock);

    if (!initialStock.success) {
      // console.log("❌ Initial stock check failed:", initialStock.message);
      return;
    }

    // Test 2: Try to order more than available stock
    // console.log("\n🚫 Test 2: Trying to order more than available stock");
    const excessiveQuantity = (initialStock.availableStock || 0) + 10;
    const excessiveOrder = await checkProductStock(
      testProductId,
      testVariantSize,
      excessiveQuantity
    );
    // console.log("Excessive order check:", excessiveOrder);

    // Test 3: Place a valid order
    // console.log("\n✅ Test 3: Placing a valid order");
    const orderQuantity = Math.min(2, initialStock.availableStock || 1);

    const sampleOrderData = {
      items: [
        {
          id: testProductId,
          name: "Test Product",
          price: "90000",
          description: "Test product for inventory management",
          image: "https://example.com/test.jpg",
          category: "test",
          quantity: orderQuantity,
          variant: {
            size: testVariantSize,
            price: 90000,
          },
        },
      ],
      itemsSubtotal: 90000 * orderQuantity,
      discountAmount: 0,
      shippingCost: 30000,
      totalAmount: 90000 * orderQuantity + 30000,
      shippingMethod: "standard" as const,
      paymentMethod: "cod" as const,
      appliedCoupon: null,
    };

    // console.log("Attempting to place order...");
    // Note: This would actually place an order and reduce inventory
    // const orderId = await placeOrder(testUserId, sampleOrderData);
    // console.log("✅ Order placed successfully:", orderId);

    // Test 4: Check stock after order
    // console.log("\n📊 Test 4: Checking stock after order");
    const stockAfterOrder = await checkProductStock(
      testProductId,
      testVariantSize,
      1
    );
    // console.log("Stock after order:", stockAfterOrder);

    // Test 5: Cancel order (this would restore inventory)
    // console.log("\n↩️ Test 5: Testing order cancellation");
    // Note: This would restore inventory
    // await cancelOrder(testUserId, orderId);
    // console.log("✅ Order cancelled, inventory restored");

    // console.log("\n🎉 Inventory management test completed!");
    // console.log("=====================================");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

/**
 * Simulate concurrent purchases to test transaction safety
 */
export const testConcurrentPurchases = async () => {
  const testProductId = "-OZEKNi8jt8oSgzpBmPU";
  const testVariantSize = "50";

  // console.log("🏃‍♂️ Testing Concurrent Purchases");
  // console.log("=================================");

  try {
    // Check initial stock
    const initialStock = await checkProductStock(
      testProductId,
      testVariantSize,
      1
    );
    if (!initialStock.success) {
      // console.log("❌ Cannot test concurrent purchases - no stock available");
      return;
    }

    const availableStock = initialStock.availableStock || 0;
    // console.log(`📦 Initial stock: ${availableStock}`);

    // Simulate multiple concurrent purchase attempts
    const concurrentAttempts = Math.min(5, availableStock + 2); // Try to buy more than available
    // console.log(
    //   `🚀 Simulating ${concurrentAttempts} concurrent purchase attempts...`
    // );

    const promises = Array.from(
      { length: concurrentAttempts },
      async (_, index) => {
        try {
          const result = await updateProductStock(
            testProductId,
            testVariantSize,
            -1
          );
          return { index, success: result.success, message: result.message };
        } catch (error) {
          return {
            index,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    );

    const results = await Promise.all(promises);

    // console.log("📊 Concurrent purchase results:");
    results.forEach((result, i) => {
      const status = result.success ? "✅" : "❌";
      // console.log(`  ${status} Attempt ${i + 1}: ${result.message}`);
    });

    // Check final stock
    const finalStock = await checkProductStock(
      testProductId,
      testVariantSize,
      1
    );
    // console.log(`📦 Final stock: ${finalStock.availableStock}`);

    const successfulPurchases = results.filter((r) => r.success).length;
    const expectedFinalStock = availableStock - successfulPurchases;

    if (finalStock.availableStock === expectedFinalStock) {
      // console.log(
      //   "✅ Concurrent purchase test passed - inventory is consistent!"
      // );
    } else {
      // console.log(
      //   "❌ Concurrent purchase test failed - inventory inconsistency detected!"
      // );
    }

    // console.log("=================================");
  } catch (error) {
    console.error("❌ Concurrent purchase test failed:", error);
  }
};

/**
 * Display current inventory status for all products
 */
export const displayInventoryStatus = async () => {
  // console.log("📊 Current Inventory Status");
  // console.log("===========================");

  // This would require fetching all products from Firebase
  // For now, we'll just show how to check specific products

  const testProducts = [
    {
      id: "-OZEKNi8jt8oSgzpBmPU",
      name: "DR.CEUTICS Gentle Olive Cleansing Foam",
    },
    { id: "-OZMLBjawEqlGyvXipNJ", name: "Cocoon Cà Phê Đắk Lắk 150ml" },
  ];

  for (const product of testProducts) {
    // console.log(`\n🧴 ${product.name}:`);

    // Check common variant sizes
    const commonSizes = ["50", "135", "150"];

    for (const size of commonSizes) {
      try {
        const stockCheck = await checkProductStock(product.id, size, 1);
        if (stockCheck.success && stockCheck.availableStock !== undefined) {
          // console.log(
          //   `  ${size}ml: ${stockCheck.availableStock} units in stock`
          // );
        }
      } catch (error) {
        // Size doesn't exist for this product, skip
      }
    }
  }

  // console.log("===========================");
};
