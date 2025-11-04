export interface IVariant {
  name: string;
  value: string;
  sku?: string;
  price?: number;
  stock: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  category: string;
  tags?: string[];
  images: string[];
  videoUrl?: string;
  variants: IVariant[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  status: 'draft' | 'active' | 'archived' | 'out_of_stock';
  featured: boolean;
  rating?: number;
  reviewCount?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  featured?: boolean;
  tags?: string | string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating' | 'newest' | 'oldest';
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductResponse {
  product: Product;
}
