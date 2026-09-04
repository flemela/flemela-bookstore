// =============================================================================
// types/index.ts
// Shared TypeScript interfaces with promotion and compare-at discount support.
// =============================================================================

export type BookFormatType = 'pdf' | 'epub' | 'hardcopy';
export type DeliveryMethodType = 'digital' | 'pickup' | 'delivery';
export type BookStatus = 'draft' | 'published' | 'archived';
export type OrderFulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface ProductImage {
  image_url: string;
  image_public_id: string;
  sort_order: number;
}

export interface ProductFormat {
  id: string;
  product_id: string;
  format: BookFormatType;
  price: number;
  compare_at_price?: number | null;
  file_url: string | null;
  file_public_id: string | null;
  file_size_bytes: number | null;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  org_id: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  sku?: string | null;
  author?: string | null;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  status: BookStatus;
  badge?:
    | 'BESTSELLER'
    | 'FLASH_SALE'
    | 'NO1_PICK'
    | 'DEAL_OF_WEEK'
    | 'LIMITED_TIME'
    | string
    | null;
  sale_ends_at?: string | null;
  rating?: number;
  reviews_count?: number;
  images: ProductImage[];
  formats: ProductFormat[];
  created_at: string;
  updated_at: string;
  isSeed?: boolean;
}

export interface CartItem {
  productId: string;
  formatId: string;
  title: string;
  format: BookFormatType;
  price: number;
  compare_at_price?: number | null;
  quantity: number;
  deliveryMethod: DeliveryMethodType;
  coverUrl?: string | null;
  author?: string | null;
}

export interface DigitalDownload {
  id: string;
  order_item_id: string;
  format_id: string | null;
  download_token: string;
  max_downloads: number;
  download_count: number;
  expires_at: string;
  book_title?: string | null;
  format?: 'pdf' | 'epub' | null;
  created_at: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryLocation: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'mpesa_manual' | 'mpesa' | 'mpesa_cash';
  mpesaCode?: string | null;
  notes?: string | null;
  customerLat?: number | null;
  customerLng?: number | null;
  items: Array<{
    product_id: string;
    format_id?: string | null;
    quantity: number;
    delivery_method: DeliveryMethodType;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}