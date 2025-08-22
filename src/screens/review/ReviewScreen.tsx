import React, { useState, useEffect } from "react";
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
} from "../../services/reviewService";
import { getOrder, Order } from "../../services/orderService";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

type ReviewScreenRouteProp = RouteProp<any, any>;
type ReviewScreenNavigationProp = StackNavigationProp<any, any>;

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  editable?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 32,
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

export default function ReviewScreen() {
  const navigation = useNavigation<ReviewScreenNavigationProp>();
  const route = useRoute<ReviewScreenRouteProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  const { orderId, productId } = route.params as {
    orderId: string;
    productId: string;
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review state
  const [productRating, setProductRating] = useState(5);
  const [shippingRating, setShippingRating] = useState(5);
  const [comment, setComment] = useState("");

  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const initializeReview = async () => {
      if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để đánh giá sản phẩm");
        navigation.goBack();
        return;
      }

      try {
        setLoading(true);

        // Lấy thông tin order
        const orderData = await getOrder(user.uid, orderId);
        if (!orderData) {
          Alert.alert("Lỗi", "Không tìm thấy thông tin đơn hàng");
          navigation.goBack();
          return;
        }

        setOrder(orderData);

        // Tìm sản phẩm trong order
        const productInOrder = orderData.items.find(
          (item) => item.id === productId
        );
        if (!productInOrder) {
          Alert.alert("Lỗi", "Không tìm thấy sản phẩm trong đơn hàng");
          navigation.goBack();
          return;
        }

        setProduct(productInOrder);

        // Kiểm tra quyền đánh giá
        const canReviewResult = await canUserReviewProduct(
          user.uid,
          productId,
          orderId
        );
        if (!canReviewResult) {
          Alert.alert(
            "Không thể đánh giá",
            "Bạn đã đánh giá sản phẩm này hoặc đơn hàng chưa được giao thành công",
            [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return;
        }

        setCanReview(true);
      } catch (error) {
        console.error("Error initializing review:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin đánh giá");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    initializeReview();
  }, [user, orderId, productId, navigation]);

  const handleSubmitReview = async () => {
    if (!user || !product || !order) return;

    if (comment.trim().length < 3) {
      Alert.alert("Thông báo", "Vui lòng viết nhận xét ít nhất 3 ký tự");
      return;
    }

    try {
      setSubmitting(true);

      await createReview({
        userId: user.uid,
        userName: user.displayName || "Khách hàng",
        orderId,
        productId,
        productName: product.name,
        productImage: product.image,
        rating: productRating,
        shippingRating,
        comment: comment.trim(),
      });

      Toast.show({
        text1: "Đánh giá thành công!",
        text2: "Cảm ơn bạn đã đánh giá sản phẩm",
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert(
        "Lỗi",
        error instanceof Error
          ? error.message
          : "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
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

  if (!canReview || !product) {
    return null;
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
        <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Info */}
        <View style={styles.productSection}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.orderInfo}>
              Đơn hàng #{order?.id?.slice(-6).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Product Rating Section */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingHeader}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.ratingTitle}>Đánh giá sản phẩm</Text>
          </View>

          <StarRating
            rating={productRating}
            onRatingChange={setProductRating}
            size={40}
          />

          <Text style={styles.ratingText}>{getRatingText(productRating)}</Text>
        </View>

        {/* Shipping Rating Section */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingHeader}>
            <Ionicons name="car" size={20} color="#3498db" />
            <Text style={styles.ratingTitle}>Đánh giá vận chuyển</Text>
          </View>

          <StarRating
            rating={shippingRating}
            onRatingChange={setShippingRating}
            size={40}
          />

          <Text style={styles.ratingText}>{getRatingText(shippingRating)}</Text>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <View style={styles.ratingHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#2ecc71" />
            <Text style={styles.ratingTitle}>Nhận xét của bạn</Text>
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
            maxLength={500}
          />

          <Text style={styles.characterCount}>{comment.length}/500 ký tự</Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || comment.trim().length < 3) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitReview}
            disabled={submitting || comment.trim().length < 3}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Đánh giá của bạn sẽ giúp khách hàng khác có thêm thông tin hữu ích
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

  // Product Section
  productSection: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
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
    marginBottom: 6,
  },
  orderInfo: {
    fontSize: 14,
    color: "#7f8c8d",
  },

  // Rating Section
  ratingSection: {
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
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // Comment Section
  commentSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2c3e50",
    minHeight: 120,
    backgroundColor: "#f8fafc",
  },
  characterCount: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "right",
    marginTop: 8,
  },

  // Submit Section
  submitSection: {
    padding: 20,
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: "#FF6B7D",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  noteText: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 18,
  },
});
