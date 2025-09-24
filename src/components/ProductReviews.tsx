import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getProductReviews,
  getProductReviewSummary,
  forceRefreshProductSummary,
  debugProductReviews,
  Review,
  ProductReviewSummary,
} from "../services/reviewService";

interface ProductReviewsProps {
  productId: string;
  showAll?: boolean;
  maxVisible?: number;
}

interface StarRatingDisplayProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  size = 14,
  showNumber = true,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.starRatingContainer}>
      <View style={styles.stars}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Ionicons
            key={`full-${index}`}
            name="star"
            size={size}
            color="#FFB800"
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <Ionicons name="star-half" size={size} color="#FFB800" />
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Ionicons
            key={`empty-${index}`}
            name="star-outline"
            size={size}
            color="#E0E0E0"
          />
        ))}
      </View>

      {showNumber && (
        <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
};

const ReviewItem: React.FC<{ review: Review }> = ({ review }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {review.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{review.userName}</Text>
            <Text style={styles.reviewDate}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <StarRatingDisplay
            rating={review.rating}
            size={12}
            showNumber={false}
          />
        </View>
      </View>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      {review.shippingRating && (
        <View style={styles.shippingRating}>
          <Ionicons name="car" size={12} color="#3498db" />
          <Text style={styles.shippingRatingText}>
            Vận chuyển: {review.shippingRating}/5 ⭐
          </Text>
        </View>
      )}
    </View>
  );
};

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  showAll = false,
  maxVisible = 3,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(showAll);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);

        // Force refresh để đảm bảo data mới nhất
        const [reviewsData, summaryData] = await Promise.all([
          getProductReviews(productId, false), // false = no cache
          getProductReviewSummary(productId),
        ]);

        console.log(`📊 Loaded reviews for product ${productId}:`, {
          reviewsCount: reviewsData.length,
          summaryTotal: summaryData?.totalReviews,
          summaryAvg: summaryData?.averageRating,
        });

        setReviews(reviewsData);
        setSummary(summaryData);

        // Nếu có sự không khớp, debug và fix
        if (summaryData && reviewsData.length !== summaryData.totalReviews) {
          console.log(
            `⚠️ Data mismatch detected! Reviews: ${reviewsData.length}, Summary: ${summaryData.totalReviews}`
          );

          // Debug để hiểu rõ vấn đề
          await debugProductReviews(productId);

          // Reload summary sau khi debug fix
          const updatedSummary = await getProductReviewSummary(productId);
          setSummary(updatedSummary);
          // console.log("✅ Summary after debug fix:", updatedSummary);
        } else {
          // console.log("✅ Review data is consistent!");
        }
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF6B7D" />
        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.noReviewsInline}>
          <Ionicons name="star-outline" size={14} color="#E0E0E0" />
          <Text style={styles.noReviewsInlineText}>Chưa có đánh giá</Text>
        </View>
      </View>
    );
  }

  const visibleReviews = expanded ? reviews : reviews.slice(0, maxVisible);
  const hasMoreReviews = reviews.length > maxVisible;

  return (
    <View style={styles.container}>
      {/* Review Summary */}
      <View style={styles.summaryContainer}>
        <StarRatingDisplay rating={summary.averageRating} size={16} />
        <Text style={styles.totalReviews}>
          ({summary.totalReviews} đánh giá)
          {/* Debug info - xóa sau khi fix */}
          {reviews.length !== summary.totalReviews && (
            <Text style={{ color: "red", fontSize: 10 }}>
              {" "}
              [Actual: {reviews.length}]
            </Text>
          )}
        </Text>
      </View>

      {/* Rating Distribution (if expanded) */}
      {expanded && summary.totalReviews > 0 && (
        <View style={styles.distributionContainer}>
          <Text style={styles.distributionTitle}>Phân bổ đánh giá</Text>
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              summary.ratingDistribution[
                star as keyof typeof summary.ratingDistribution
              ];
            const percentage =
              summary.totalReviews > 0
                ? (count / summary.totalReviews) * 100
                : 0;

            return (
              <View key={star} style={styles.distributionRow}>
                <Text style={styles.starLabel}>{star} ⭐</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${percentage}%` }]}
                  />
                </View>
                <Text style={styles.countLabel}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Reviews List */}
      {visibleReviews.length > 0 && (
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Đánh giá từ khách hàng</Text>

          {visibleReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}

          {/* Show More/Less Button */}
          {hasMoreReviews && !showAll && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.showMoreText}>
                {expanded
                  ? `Thu gọn`
                  : `Xem thêm ${reviews.length - maxVisible} đánh giá`}
              </Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="#FF6B7D"
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  noReviewsContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 8,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 12,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
    textAlign: "center",
  },

  // Summary Styles
  summaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  starRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 6,
  },
  totalReviews: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 8,
  },
  noReviewsInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  noReviewsInlineText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 6,
  },

  // Distribution Styles
  distributionContainer: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    width: 30,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginHorizontal: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFB800",
    borderRadius: 3,
  },
  countLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    width: 20,
    textAlign: "right",
  },

  // Reviews List Styles
  reviewsContainer: {
    marginTop: 16,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B7D",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitial: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  userDetails: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  reviewDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: "flex-end",
  },
  reviewComment: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
    marginBottom: 8,
  },
  shippingRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  shippingRatingText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
  },

  // Show More Button
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: "#FF6B7D",
    fontWeight: "500",
    marginRight: 4,
  },
});

export default ProductReviews;
