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
};

export type TabParamList = {
  HomeScreen: undefined;
  SearchScreen: undefined;
  NotifyScreen: undefined;
  ProfileScreen: undefined;
};
