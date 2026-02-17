

export enum UserType {
  GENERAL = 'ทั่วไป',
  TEACHER = 'ครู',
  STUDENT = 'นักเรียน'
}

// Change enum to a string-based type to allow dynamic categories
export type ProductCategory = string;

export type ProductType = 'drink' | 'snack';

export interface Category {
  id: string;
  name: string;
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

export enum PaymentStatus {
  PENDING = 'รอชำระ',
  PAID = 'ชำระแล้ว'
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
  productType: ProductType;
  prices: {
    [ServingType.HOT]?: PriceStructure;
    [ServingType.ICED]?: PriceStructure;
    [ServingType.FRAPPE]?: PriceStructure;
    [ServingType.SNACK]?: PriceStructure;
  };
  description: string;
  image: string; 
  additionalImages?: string[]; 
  video?: string; 
  isPopular?: boolean;
  isRecommended?: boolean;
}

export interface CartItem extends Omit<Product, 'prices'> {
  cartId: string;
  quantity: number;
  sweetness: string; 
  appliedPrice: number; 
  selectedUserType: UserType;
  selectedServingType: ServingType; 
}

export interface Order {
  id: string;
  customerName: string;
  userType: UserType; 
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus; 
  deliveryLocation: string;
  status: OrderStatus;
  slipUrl?: string; 
  timestamp: number; 
}

export interface SalesSummary {
  date: string;
  totalSales: number;
  orderCount: number;
  teacherCount: number;
  studentCount: number;
}