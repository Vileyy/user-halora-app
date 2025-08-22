import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserReviews, Review } from "../services/reviewService";

interface UserReviewListProps {
  userId: string;
  maxVisible?: number;
  showTitle?: boolean;
  onReviewPress?: (review: Review) => void;
}

interface StarDisplayProps {
  rating: number;
  size?: number;
}

const StarDisplay: React.FC<StarDisplayProps> = ({ rating, size = 12 }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={size}
          color={star <= rating ? "#FFB800" : "#E0E0E0"}
        />
      ))}
    </View>
  );
};

const UserReviewItem: React.FC<{
  review: Review;
  onPress?: (review: Review) => void;
}> = ({ review, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <TouchableOpacity
      style={styles.reviewItem}
      onPress={() => onPress?.(review)}
      activeOpacity={0.7}
    >
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.productImage }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.reviewContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {review.productName}
          </Text>
          <View style={styles.ratingRow}>
            <StarDisplay rating={review.rating} />
            <Text style={styles.reviewDate}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
          <Text style={styles.reviewComment} numberOfLines={2}>
            {review.comment}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const UserReviewList: React.FC<UserReviewListProps> = ({
  userId,
  maxVisible = 5,
  showTitle = true,
  onReviewPress,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const loadReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const userReviews = await getUserReviews(userId);
      setReviews(userReviews);
    } catch (error) {
      console.error("Error loading user reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const onRefresh = () => {
    loadReviews(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF6B7D" />
        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {showTitle && <Text style={styles.title}>Đánh giá của tôi</Text>}
        <View style={styles.emptyContent}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={48}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>Bạn chưa có đánh giá nào</Text>
          <Text style={styles.emptySubtext}>
            Đánh giá các sản phẩm bạn đã mua để chia sẻ trải nghiệm
          </Text>
        </View>
      </View>
    );
  }

  const visibleReviews = showAll ? reviews : reviews.slice(0, maxVisible);
  const hasMoreReviews = reviews.length > maxVisible;

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Đánh giá của tôi</Text>
          <Text style={styles.subtitle}>{reviews.length} đánh giá</Text>
        </View>
      )}

      <FlatList
        data={visibleReviews}
        keyExtractor={(item) => item.id || ""}
        renderItem={({ item }) => (
          <UserReviewItem review={item} onPress={onReviewPress} />
        )}
        scrollEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B7D"]}
            tintColor="#FF6B7D"
          />
        }
      />

      {hasMoreReviews && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreText}>
            {showAll
              ? "Thu gọn"
              : `Xem thêm ${reviews.length - maxVisible} đánh giá`}
          </Text>
          <Ionicons
            name={showAll ? "chevron-up" : "chevron-down"}
            size={16}
            color="#FF6B7D"
          />
        </TouchableOpacity>
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
  emptyContainer: {
    backgroundColor: "white",
  },
  emptyContent: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
    textAlign: "center",
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },

  // Review Item
  reviewItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f1f2f6",
  },
  reviewContent: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  reviewComment: {
    fontSize: 13,
    color: "#2c3e50",
    lineHeight: 18,
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

export default UserReviewList;
