import { getDatabase, ref, push, set, get } from "firebase/database";

export interface Review {
  id?: string;
  userId: string;
  userName: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number; // 1-5 stars
  shippingRating: number; // 1-5 stars for shipping
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const database = getDatabase();

// Simple cache to avoid fetching data continuously
const reviewsCache = new Map<string, { data: Review[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;     

/**
 * Create a new review for a product
 */
export const createReview = async (
  reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    // Check if user has already reviewed this product from this order
    const existingReview = await getReviewByOrderAndProduct(
      reviewData.userId,
      reviewData.orderId,
      reviewData.productId
    );

    if (existingReview) {
      throw new Error("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi");
    }

    // Create new review
    const reviewsRef = ref(database, "reviews");
    const newReviewRef = push(reviewsRef);

    const review: Review = {
      ...reviewData,
      id: newReviewRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(newReviewRef, review);

    // Update summary for product and clear cache
    await updateProductReviewSummary(reviewData.productId);
    clearReviewCache(reviewData.productId);

    return newReviewRef.key!;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
};

/**
 * Get review by orderId and productId
 */
export const getReviewByOrderAndProduct = async (
  userId: string,
  orderId: string,
  productId: string
): Promise<Review | null> => {
  try {
    const reviewsRef = ref(database, "reviews");
    const snapshot = await get(reviewsRef);

    if (snapshot.exists()) {
      const reviews = snapshot.val();
      for (const key in reviews) {
        const review = reviews[key];
        if (
          review.userId === userId &&
          review.orderId === orderId &&
          review.productId === productId
        ) {
          return { ...review, id: key };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting review:", error);
    return null;
  }
};

/**
 * Get all reviews for a product
 */
export const getProductReviews = async (
  productId: string,
  useCache: boolean = true
): Promise<Review[]> => {
  try {
    // Check cache first
    if (useCache) {
      const cached = reviewsCache.get(productId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    const reviewsRef = ref(database, "reviews");
    const snapshot = await get(reviewsRef);

    if (snapshot.exists()) {
      const reviews = snapshot.val();
      const reviewList: Review[] = [];

      for (const key in reviews) {
        const review = reviews[key];
        if (review.productId === productId) {
          reviewList.push({ ...review, id: key });
        }
      }

      // Sort by createdAt (newest first)
      reviewList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (useCache) {
        reviewsCache.set(productId, {
          data: reviewList,
          timestamp: Date.now(),
        });
      }

      return reviewList;
    }
    return [];
  } catch (error) {
    console.error("Error getting product reviews:", error);
    return [];
  }
};

/**
 * Update review summary for a product
 */
export const updateProductReviewSummary = async (
  productId: string
): Promise<void> => {
  try {
    const reviews = await getProductReviews(productId, false);
    if (reviews.length === 0) {
      const summaryRef = ref(database, `products/${productId}/reviewSummary`);
      await set(summaryRef, null);
      return;
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      totalRating += review.rating;
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    const averageRating = Number((totalRating / reviews.length).toFixed(1));

    const summary: ProductReviewSummary = {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    };

    const summaryRef = ref(database, `products/${productId}/reviewSummary`);
    await set(summaryRef, summary);
  } catch (error) {
    console.error("Error updating product review summary:", error);
    throw error;
  }
};

/**
 * Get review summary for a product
 */
export const getProductReviewSummary = async (
  productId: string
): Promise<ProductReviewSummary | null> => {
  try {
    const summaryRef = ref(database, `products/${productId}/reviewSummary`);
    const snapshot = await get(summaryRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error getting product review summary:", error);
    return null;
  }
};

// Check if user can review product
export const canUserReviewProduct = async (
  userId: string,
  productId: string,
  orderId: string
): Promise<boolean> => {
  try {
    // Check if order exists and has status delivered
    const orderRef = ref(database, `users/${userId}/orders/${orderId}`);
    const orderSnapshot = await get(orderRef);

    if (!orderSnapshot.exists()) {
      return false;
    }

    const order = orderSnapshot.val();
    if (order.status !== "delivered") {
      return false;
    }

    // Check if product is in order
    const hasProduct = order.items?.some((item: any) => item.id === productId);
    if (!hasProduct) {
      return false;
    }

    // Check if user has already reviewed this product
    const existingReview = await getReviewByOrderAndProduct(
      userId,
      orderId,
      productId
    );
    return existingReview === null;
  } catch (error) {
    console.error("Error checking review permission:", error);
    return false;
  }
};

/**
 * Clear cache for a specific product (debug function)
 */
export const clearReviewCache = (productId?: string): void => {
  if (productId) {
    reviewsCache.delete(productId);
  } else {
    reviewsCache.clear();
  }
};

/**
 * Force refresh summary for a product (debug function)     
 */
export const forceRefreshProductSummary = async (
  productId: string
): Promise<void> => {
  // Clear cache first
  clearReviewCache(productId);

  // Update summary with fresh data
  await updateProductReviewSummary(productId);
};

/**
 * Debug function - check data inconsistency 
 */
export const debugProductReviews = async (productId: string): Promise<void> => {
  try {
    // 1. Get all reviews (no cache)
    const allReviews = await getProductReviews(productId, false);

    // 2. Get current summary
    const currentSummary = await getProductReviewSummary(productId);

    // 3. Calculate what summary should be
    if (allReviews.length > 0) {
      const shouldBe = {
        totalReviews: allReviews.length,
        averageRating: Number(
          (
            allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          ).toFixed(1)
        ),
        ratingDistribution: allReviews.reduce(
          (dist, r) => {
            dist[r.rating as keyof typeof dist]++;
            return dist;
          },
          { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        ),
      };

      // 4. Check for mismatch
      const mismatch =
        !currentSummary ||
        currentSummary.totalReviews !== shouldBe.totalReviews ||
        currentSummary.averageRating !== shouldBe.averageRating;

      if (mismatch) {
        await forceRefreshProductSummary(productId);

        const fixedSummary = await getProductReviewSummary(productId);
      } else {
      }
    }
  } catch (error) {
    console.error("Debug failed:", error);
  }
};

/**
 * Get all reviews for a user
 */
export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const reviewsRef = ref(database, "reviews");
    const snapshot = await get(reviewsRef);

    if (snapshot.exists()) {
      const reviews = snapshot.val();
      const userReviewList: Review[] = [];

      for (const key in reviews) {
        const review = reviews[key];
        if (review.userId === userId) {
          userReviewList.push({ ...review, id: key });
        }
      }

      // Sort by createdAt (newest first)
      userReviewList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return userReviewList;
    }
    return [];
  } catch (error) {
    console.error("Error getting user reviews:", error);
    return [];
  }
};

/**
 * Get review stats for admin/analytics
 */
export const getReviewStats = async (): Promise<{
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}> => {
  try {
    const reviewsRef = ref(database, "reviews");
    const snapshot = await get(reviewsRef);

    if (snapshot.exists()) {
      const reviews = snapshot.val();
      const reviewList: Review[] = [];

      for (const key in reviews) {
        reviewList.push({ ...reviews[key], id: key });
      }

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      reviewList.forEach((review) => {
        totalRating += review.rating;
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return {
        totalReviews: reviewList.length,
        averageRating:
          reviewList.length > 0
            ? Number((totalRating / reviewList.length).toFixed(1))
            : 0,
        ratingDistribution,
      };
    }

    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  } catch (error) {
    console.error("Error getting review stats:", error);
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
};
