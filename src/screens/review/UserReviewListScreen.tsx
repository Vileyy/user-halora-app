import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { getUserReviews, Review } from "../../services/reviewService";

const { width, height } = Dimensions.get("window");

interface StarDisplayProps {
  rating: number;
  size?: number;
}

const StarDisplay: React.FC<StarDisplayProps> = ({ rating, size = 14 }) => {
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

const ReviewItem: React.FC<{
  review: Review;
  onPress: (review: Review) => void;
}> = ({ review, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={styles.reviewItem}
      onPress={() => onPress(review)}
      activeOpacity={0.7}
    >
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.productImage }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.reviewInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {review.productName}
          </Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <StarDisplay rating={review.rating} size={16} />
        </View>
      </View>

      <Text style={styles.reviewComment} numberOfLines={3}>
        {review.comment}
      </Text>

      {review.shippingRating && (
        <View style={styles.shippingRating}>
          <Ionicons name="car" size={14} color="#3498db" />
          <Text style={styles.shippingRatingText}>
            Vận chuyển: {review.shippingRating}/5 ⭐
          </Text>
        </View>
      )}

      <View style={styles.orderInfo}>
        <Ionicons name="receipt-outline" size={14} color="#666" />
        <Text style={styles.orderIdText}>
          Đơn hàng #{review.orderId?.slice(-6).toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function UserReviewListScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const userReviews = await getUserReviews(user.uid);
      setReviews(userReviews);
    } catch (error) {
      console.error("Error loading user reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadReviews(true);
  };

  const handleReviewPress = (review: Review) => {
    setSelectedReview(review);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReview(null);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B7D" />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý đánh giá</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Tổng đánh giá</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {reviews.length > 0
              ? (
                  reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                ).toFixed(1)
              : "0.0"}
          </Text>
          <Text style={styles.statLabel}>Điểm trung bình</Text>
        </View>
      </View>

      {/* Reviews List */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B7D"]}
            tintColor="#FF6B7D"
          />
        }
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
            <Text style={styles.emptySubtitle}>
              Bạn chưa đánh giá sản phẩm nào. Hãy mua sắm và đánh giá để chia sẻ
              trải nghiệm!
            </Text>
          </View>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onPress={handleReviewPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Review Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedReview && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết đánh giá</Text>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <ScrollView
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Product Info */}
                  <View style={styles.modalProductSection}>
                    <Image
                      source={{ uri: selectedReview.productImage }}
                      style={styles.modalProductImage}
                      resizeMode="cover"
                    />
                    <View style={styles.modalProductInfo}>
                      <Text style={styles.modalProductName}>
                        {selectedReview.productName}
                      </Text>
                      <View style={styles.modalRatingContainer}>
                        <StarDisplay rating={selectedReview.rating} size={20} />
                        <Text style={styles.modalRatingText}>
                          {selectedReview.rating}/5
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Review Details */}
                  <View style={styles.modalReviewSection}>
                    <Text style={styles.modalSectionTitle}>
                      Nhận xét của bạn
                    </Text>
                    <Text style={styles.modalReviewComment}>
                      {selectedReview.comment}
                    </Text>
                  </View>

                  {/* Shipping Rating */}
                  {selectedReview.shippingRating && (
                    <View style={styles.modalShippingSection}>
                      <Text style={styles.modalSectionTitle}>
                        Đánh giá vận chuyển
                      </Text>
                      <View style={styles.modalShippingRating}>
                        <StarDisplay
                          rating={selectedReview.shippingRating}
                          size={18}
                        />
                        <Text style={styles.modalShippingText}>
                          {selectedReview.shippingRating}/5
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Order Info */}
                  <View style={styles.modalOrderSection}>
                    <Text style={styles.modalSectionTitle}>
                      Thông tin đơn hàng
                    </Text>
                    <View style={styles.modalOrderInfo}>
                      <View style={styles.modalOrderRow}>
                        <Ionicons
                          name="receipt-outline"
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.modalOrderLabel}>Mã đơn hàng:</Text>
                        <Text style={styles.modalOrderValue}>
                          #{selectedReview.orderId?.slice(-6).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.modalOrderRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.modalOrderLabel}>
                          Ngày đánh giá:
                        </Text>
                        <Text style={styles.modalOrderValue}>
                          {formatFullDate(selectedReview.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statsContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B7D",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#eee",
    marginHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  reviewsList: {
    paddingVertical: 16,
  },
  reviewItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f1f2f6",
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  ratingContainer: {
    alignItems: "flex-end",
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewComment: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
    marginBottom: 12,
  },
  shippingRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  shippingRatingText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderIdText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Modal Product Section
  modalProductSection: {
    flexDirection: "row",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalProductImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f1f2f6",
    marginRight: 16,
  },
  modalProductInfo: {
    flex: 1,
    justifyContent: "center",
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  modalRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalRatingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B7D",
    marginLeft: 8,
  },

  // Modal Review Section
  modalReviewSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  modalReviewComment: {
    fontSize: 15,
    color: "#2c3e50",
    lineHeight: 22,
  },

  // Modal Shipping Section
  modalShippingSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalShippingRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalShippingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
    marginLeft: 8,
  },

  // Modal Order Section
  modalOrderSection: {
    paddingVertical: 20,
  },
  modalOrderInfo: {
    marginTop: 8,
  },
  modalOrderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalOrderLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    marginRight: 8,
    minWidth: 100,
  },
  modalOrderValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
});
