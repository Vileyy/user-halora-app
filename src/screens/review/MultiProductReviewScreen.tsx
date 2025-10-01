import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import {
  createReview,
  canUserReviewProduct,
  getReviewByOrderAndProduct,
} from "../../services/reviewService";
import { getOrder, Order, OrderItem } from "../../services/orderService";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

type MultiProductReviewScreenRouteProp = RouteProp<any, any>;
type MultiProductReviewScreenNavigationProp = StackNavigationProp<any, any>;

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  editable?: boolean;
}

interface ProductReviewData {
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  shippingRating: number;
  comment: string;
  canReview: boolean;
  hasExistingReview: boolean;
  isSubmitting: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 24,
  editable = true,
}) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => editable && onRatingChange(star)}
          disabled={!editable}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? "#FFD700" : "#E0E0E0"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function MultiProductReviewScreen() {
  const navigation = useNavigation<MultiProductReviewScreenNavigationProp>();
  const route = useRoute<MultiProductReviewScreenRouteProp>();
  const user = useSelector((state: RootState) => state.auth.user);
  const scrollViewRef = useRef<ScrollView>(null);

  const { orderId } = route.params as {
    orderId: string;
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [productReviews, setProductReviews] = useState<ProductReviewData[]>([]);

  useEffect(() => {
    const initializeReviews = async () => {
      if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để đánh giá sản phẩm");
        navigation.goBack();
        return;
      }

      try {
        setLoading(true);
        const orderData = await getOrder(user.uid, orderId);
        if (!orderData) {
          Alert.alert("Lỗi", "Không tìm thấy thông tin đơn hàng");
          navigation.goBack();
          return;
        }

        setOrder(orderData);

        // Get review data for each product
        const reviewsData: ProductReviewData[] = [];

        // Loại bỏ duplicate products (chỉ giữ unique productId)
        const uniqueProducts = orderData.items.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );

        for (const item of uniqueProducts) {
          const canReview = await canUserReviewProduct(
            user.uid,
            item.id,
            orderId
          );
          const existingReview = await getReviewByOrderAndProduct(
            user.uid,
            orderId,
            item.id
          );

          reviewsData.push({
            productId: item.id,
            productName: item.name,
            productImage: item.image,
            rating: 5,
            shippingRating: 5,
            comment: "",
            canReview,
            hasExistingReview: !!existingReview,
            isSubmitting: false,
          });
        }

        setProductReviews(reviewsData);
      } catch (error) {
        console.error("Error initializing reviews:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin đánh giá");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    initializeReviews();
  }, [user, orderId, navigation]);

  const updateProductReview = (
    productId: string,
    field: keyof ProductReviewData,
    value: any
  ) => {
    setProductReviews((prev) =>
      prev.map((review) =>
        review.productId === productId ? { ...review, [field]: value } : review
      )
    );
  };

  const handleSubmitReview = async (productId: string) => {
    if (!user || !order) return;

    const productReview = productReviews.find((r) => r.productId === productId);
    if (!productReview) return;

    if (productReview.comment.trim().length < 3) {
      Alert.alert("Thông báo", "Vui lòng viết nhận xét ít nhất 3 ký tự");
      return;
    }

    try {
      updateProductReview(productId, "isSubmitting", true);

      await createReview({
        userId: user.uid,
        userName: user.displayName || "Khách hàng",
        orderId,
        productId,
        productName: productReview.productName,
        productImage: productReview.productImage,
        rating: productReview.rating,
        shippingRating: productReview.shippingRating,
        comment: productReview.comment.trim(),
      });

      updateProductReview(productId, "hasExistingReview", true);
      updateProductReview(productId, "canReview", false);

      Toast.show({
        text1: "Đánh giá thành công!",
        text2: `Cảm ơn bạn đã đánh giá ${productReview.productName}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert(
        "Lỗi",
        error instanceof Error
          ? error.message
          : "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      updateProductReview(productId, "isSubmitting", false);
    }
  };

  // Auto scroll to the focused input
  const handleCommentFocus = (index: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: index * 400 + 200,
        animated: true,
      });
    }, 300);
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1:
        return "Rất không hài lòng";
      case 2:
        return "Không hài lòng";
      case 3:
        return "Bình thường";
      case 4:
        return "Hài lòng";
      case 5:
        return "Rất hài lòng";
      default:
        return "Chưa đánh giá";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B7D" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  const reviewableProducts = productReviews.filter(
    (p) => p.canReview && !p.hasExistingReview
  );
  const reviewedProducts = productReviews.filter((p) => p.hasExistingReview);

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
        <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Order Info */}
        <View style={styles.orderSection}>
          <Text style={styles.orderTitle}>
            Đơn hàng #{order?.id?.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.orderSubtitle}>
            {reviewableProducts.length > 0
              ? `${reviewableProducts.length} sản phẩm chưa đánh giá`
              : "Tất cả sản phẩm đã được đánh giá"}
          </Text>
        </View>

        {/* Reviewable Products */}
        {reviewableProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sản phẩm chưa đánh giá</Text>
            </View>

            {reviewableProducts.map((productReview, index) => (
              <View
                key={`reviewable-${productReview.productId}-${index}`}
                style={styles.productSection}
              >
                {/* Product Info */}
                <View style={styles.productHeader}>
                  <Image
                    source={{ uri: productReview.productImage }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {productReview.productName}
                    </Text>
                  </View>
                </View>

                {/* Product Rating */}
                <View style={styles.ratingSection}>
                  <View style={styles.ratingHeader}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingTitle}>Đánh giá sản phẩm</Text>
                  </View>
                  <StarRating
                    rating={productReview.rating}
                    onRatingChange={(rating) =>
                      updateProductReview(
                        productReview.productId,
                        "rating",
                        rating
                      )
                    }
                    size={28}
                  />
                  <Text style={styles.ratingText}>
                    {getRatingText(productReview.rating)}
                  </Text>
                </View>

                {/* Shipping Rating */}
                <View style={styles.ratingSection}>
                  <View style={styles.ratingHeader}>
                    <Ionicons name="car" size={16} color="#3498db" />
                    <Text style={styles.ratingTitle}>Vận chuyển</Text>
                  </View>
                  <StarRating
                    rating={productReview.shippingRating}
                    onRatingChange={(rating) =>
                      updateProductReview(
                        productReview.productId,
                        "shippingRating",
                        rating
                      )
                    }
                    size={28}
                  />
                  <Text style={styles.ratingText}>
                    {getRatingText(productReview.shippingRating)}
                  </Text>
                </View>

                {/* Comment */}
                <View style={styles.commentSection}>
                  <View style={styles.ratingHeader}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={16}
                      color="#2ecc71"
                    />
                    <Text style={styles.ratingTitle}>Nhận xét</Text>
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    multiline
                    numberOfLines={4}
                    value={productReview.comment}
                    onChangeText={(text) =>
                      updateProductReview(
                        productReview.productId,
                        "comment",
                        text
                      )
                    }
                    onFocus={() => handleCommentFocus(index)}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={styles.characterCount}>
                    {productReview.comment.length}/500 ký tự
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (productReview.isSubmitting ||
                      productReview.comment.trim().length < 3) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={() => handleSubmitReview(productReview.productId)}
                  disabled={
                    productReview.isSubmitting ||
                    productReview.comment.trim().length < 3
                  }
                >
                  {productReview.isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="white"
                      />
                      <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Already Reviewed Products */}
        {reviewedProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đã đánh giá</Text>
            </View>

            {reviewedProducts.map((productReview, index) => (
              <View
                key={`reviewed-${productReview.productId}-${index}`}
                style={styles.reviewedSection}
              >
                <View style={styles.productHeader}>
                  <Image
                    source={{ uri: productReview.productImage }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {productReview.productName}
                    </Text>
                    <View style={styles.reviewedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#27ae60"
                      />
                      <Text style={styles.reviewedText}>Đã đánh giá</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Info Note */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 Đánh giá của bạn sẽ giúp khách hàng khác có thêm thông tin hữu
            ích khi mua sắm
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7f8c8d",
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
  scrollContainer: {
    flex: 1,
  },

  // Order Section
  orderSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },

  // Product Section
  productSection: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f1f2f6",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },

  // Rating Section
  ratingSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 6,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // Comment Section
  commentSection: {
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2c3e50",
    minHeight: 100,
    backgroundColor: "#f8fafc",
  },
  characterCount: {
    fontSize: 11,
    color: "#7f8c8d",
    textAlign: "right",
    marginTop: 6,
  },

  // Submit Button
  submitButton: {
    backgroundColor: "#FF6B7D",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  submitButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Reviewed Section
  reviewedSection: {
    backgroundColor: "#f8f9fa",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  reviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  reviewedText: {
    fontSize: 12,
    color: "#27ae60",
    marginLeft: 4,
    fontWeight: "500",
  },

  // Info Section
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: "#e8f4fd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  infoText: {
    fontSize: 13,
    color: "#2c3e50",
    lineHeight: 18,
  },
});
