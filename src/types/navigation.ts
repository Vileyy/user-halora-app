export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  MainTabs: undefined;
  ProductListScreen: undefined;
  ProductDetailScreen: {
    product: {
      id: string;
      name: string;
      price: string;
      description: string;
      image: string;
      category: string;
    };
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
    }>;
    totalPrice: number;
  };
  OrderSuccessScreen: undefined;
  OrderDetailScreen: { orderId: string };
  OrderTrackingScreen: { orderId: string };
};

export type TabParamList = {
  HomeScreen: undefined;
  SearchScreen: undefined;
  CartScreen: undefined;
  NotifyScreen: undefined;
  ProfileScreen: undefined;
};
