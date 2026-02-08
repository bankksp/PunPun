export enum UserType {
  GENERAL = 'ทั่วไป',
  TEACHER = 'ครู',
  STUDENT = 'นักเรียน'
}

export enum ProductCategory {
  COFFEE = 'กาแฟ',
  TEA = 'ชา',
  SWEET_DRINK = 'น้ำหวาน',
  SNACK = 'ขนม'
}

export enum ServingType {
  HOT = 'ร้อน',
  ICED = 'เย็น',
  FRAPPE = 'ปั่น',
  SNACK = 'ขนม'
}

export enum OrderStatus {
  PENDING = 'รอดำเนินการ',
  PREPARING = 'กำลังทำ',
  DELIVERING = 'กำลังส่ง',
  COMPLETED = 'ส่งแล้ว',
  CANCELLED = 'ยกเลิก'
}

export enum PaymentMethod {
  CASH = 'เงินสด',
  TRANSFER = 'โอนชำระ'
}

export interface PriceStructure {
  general: number;
  teacher: number;
  student: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  // New pricing structure: Map ServingType to prices. If undefined/null, that type is unavailable.
  prices: {
    [ServingType.HOT]?: PriceStructure;
    [ServingType.ICED]?: PriceStructure;
    [ServingType.FRAPPE]?: PriceStructure;
    [ServingType.SNACK]?: PriceStructure;
  };
  description: string;
  image: string; // Main Cover Image
  additionalImages?: string[]; // Gallery
  video?: string; // Video URL or Base64
  isPopular?: boolean;
  isRecommended?: boolean; // New field for Recommended items
}

export interface CartItem extends Omit<Product, 'prices'> {
  cartId: string;
  quantity: number;
  sweetness: string; // 0%, 25%, 50%, 100%
  appliedPrice: number; // The final price calculated based on selection
  selectedUserType: UserType;
  selectedServingType: ServingType; // The chosen type (Hot/Iced/Frappe)
}

export interface Order {
  id: string;
  customerName: string;
  userType: UserType; // Representative type for the order
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  deliveryLocation: string;
  status: OrderStatus;
  slipUrl?: string; // For transfer
  timestamp: number; // Date.now()
}

export interface SalesSummary {
  date: string;
  totalSales: number;
  orderCount: number;
  teacherCount: number;
  studentCount: number;
}