export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  MainTabs: undefined;
  ProductListScreen: undefined;
  ProductDetailScreen: {
    product?: {
      id: string;
      name: string;
      price?: string;
      description: string;
      image: string;
      category: string;
      brandId?: string;
      variants?: Array<{
        price: number;
        size: string;
        stockQty: number;
        sku?: string;
      }>;
    };
    productId?: string;
  };
  ViewAllScreen: {
    category: string;
    title: string;
  };
  CartScreen: undefined;
  CheckoutScreen: {
    selectedItems: Array<{
      id: string;
      name: string;
      price: string;
      description: string;
      image: string;
      category: string;
      quantity: number;
      selectedSize?: string;
      selectedColor?: string;
      selected?: boolean;
      variant?: {
        size: string;
        price: number;
      };
    }>;
    totalPrice: number;
  };
  StripePaymentScreen: {
    selectedItems: Array<{
      id: string;
      name: string;
      price: string | number;
      description?: string;
      image: string;
      category?: string;
      quantity: number;
      selectedSize?: string;
      selectedColor?: string;
      variant?: {
        size: string;
        price: number;
      };
    }>;
    totalPrice: number;
    itemsSubtotal: number;
    discountAmount: number;
    effectiveShipping: number;
    shippingMethod: string;
    appliedCoupon: string | null;
    appliedShippingVoucher: any;
    appliedProductVoucher: any;
  };
  OrderSuccessScreen: undefined;
  OrderDetailScreen: { orderId: string };
  OrderTrackingScreen: { orderId: string };
  OrderStatusScreen: undefined;
  EditProfileScreen: undefined;
  ChangePasswordScreen: undefined;
  OrderHistoryScreen: undefined;
  VoucherScreen: {
    currentTotal?: number;
    onVoucherSelect?: (vouchers: {
      shippingVoucher?: string;
      productVoucher?: string;
    }) => void;
  };
  ReviewScreen: {
    orderId: string;
    productId: string;
  };
  MultiProductReviewScreen: {
    orderId: string;
  };
  UserReviewListScreen: undefined;
  ContactScreen: undefined;
  ChatBotScreen: {
    userProfile?: {
      id: string;
      skinType?: string;
      age?: number;
      concerns?: string[];
      currentProducts?: string[];
    };
    initialMessage?: string;
  };
};

export type TabParamList = {
  HomeScreen: undefined;
  SearchScreen: undefined;
  CartScreen: undefined;
  NotifyScreen: undefined;
  ProfileScreen: undefined;
};
