import { Product, ProductCategory, ServingType } from './types';

export const APP_NAME = "ปัญ ปันสุข คอฟฟี่";
export const LOGO_URL = "https://img2.pic.in.th/pic/IMG_8516c84ae26ba04d7a03.jpg";
export const QR_CODE_URL = "https://img5.pic.in.th/file/secure-sv1/IMG_854134530da175ca5629.jpg";

export const SWEETNESS_LEVELS = ["0% (ไม่หวาน)", "25% (หวานน้อย)", "50% (หวานปกติ)", "100% (หวานมาก)"];

// Fallback Initial Data (ใช้กรณีดึงข้อมูลไม่สำเร็จ)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'อเมริกาโน่',
    category: ProductCategory.COFFEE,
    prices: {
      [ServingType.HOT]: { general: 35, teacher: 30, student: 20 },
      [ServingType.ICED]: { general: 45, teacher: 40, student: 25 },
    },
    description: 'กาแฟดำเข้มข้น หอมกรุ่น เมล็ดกาแฟคั่วกลางถึงเข้ม',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b5dd7359?w=800&q=80',
    additionalImages: [],
    video: '',
    isPopular: true,
    isRecommended: true
  },
  {
    id: '2',
    name: 'คาปูชิโน่',
    category: ProductCategory.COFFEE,
    prices: {
      [ServingType.HOT]: { general: 45, teacher: 40, student: 25 },
      [ServingType.ICED]: { general: 50, teacher: 45, student: 30 },
      [ServingType.FRAPPE]: { general: 55, teacher: 50, student: 35 },
    },
    description: 'กาแฟฟองนมนุ่มละมุน โรยผงซินนามอนหอมๆ',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80',
    additionalImages: [],
    video: ''
  },
  {
    id: '3',
    name: 'ชาไทย',
    category: ProductCategory.TEA,
    prices: {
      [ServingType.HOT]: { general: 35, teacher: 30, student: 20 },
      [ServingType.ICED]: { general: 40, teacher: 35, student: 25 },
      [ServingType.FRAPPE]: { general: 45, teacher: 40, student: 30 },
    },
    description: 'ชาไทยสีส้มรสเข้มข้น หวานมันกำลังดี',
    image: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800&q=80',
    additionalImages: [],
    video: '',
    isPopular: true
  },
  {
    id: '4',
    name: 'ชาเขียวนม',
    category: ProductCategory.TEA,
    prices: {
      [ServingType.HOT]: { general: 35, teacher: 30, student: 20 },
      [ServingType.ICED]: { general: 40, teacher: 35, student: 25 },
      [ServingType.FRAPPE]: { general: 45, teacher: 40, student: 30 },
    },
    description: 'ชาเขียวมัทฉะแท้ กลิ่นหอมเป็นเอกลักษณ์',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
    additionalImages: [],
    video: ''
  },
  {
    id: '5',
    name: 'นมชมพู',
    category: ProductCategory.SWEET_DRINK,
    prices: {
      [ServingType.ICED]: { general: 35, teacher: 30, student: 20 },
      [ServingType.FRAPPE]: { general: 40, teacher: 35, student: 25 },
    },
    description: 'นมเย็นชื่นใจ สีสวย หวานหอมกลิ่นน้ำแดง',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
    additionalImages: [],
    video: '',
    isRecommended: true
  },
  {
    id: '6',
    name: 'โกโก้',
    category: ProductCategory.SWEET_DRINK,
    prices: {
      [ServingType.HOT]: { general: 35, teacher: 30, student: 20 },
      [ServingType.ICED]: { general: 40, teacher: 35, student: 25 },
      [ServingType.FRAPPE]: { general: 45, teacher: 40, student: 30 },
    },
    description: 'โกโก้เข้มข้น รสชาติกลมกล่อม',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
    additionalImages: [],
    video: '',
    isPopular: true
  },
  {
    id: '7',
    name: 'ครัวซองต์เนยสด',
    category: ProductCategory.SNACK,
    prices: {
      [ServingType.SNACK]: { general: 35, teacher: 30, student: 20 },
    },
    description: 'ครัวซองต์หอมเนยแท้ กรอบนอกนุ่มใน',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    additionalImages: [],
    video: '',
    isRecommended: true
  },
  {
    id: '8',
    name: 'คุ้กกี้ช็อคโกแลต',
    category: ProductCategory.SNACK,
    prices: {
       [ServingType.SNACK]: { general: 20, teacher: 15, student: 10 },
    },
    description: 'คุกกี้ชิ้นโต อัดแน่นด้วยช็อคโกแลตชิพ อบใหม่ทุกวัน',
    image: 'https://images.unsplash.com/photo-1499636138143-bd649043ea80?w=800&q=80',
    additionalImages: [],
    video: ''
  }
];

// Connected Database Configuration
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqjkkCDWmVU2yJcSpxEnmSqk_IlL0cB8_7tMCZIK7KVcvFbexjejwSXUmY8Z4tA2hi/exec";
export const DRIVE_FOLDER_ID = "1e9YhN5GHtDdKHqoqkkeSKu8jECAUeY74";