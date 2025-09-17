import { useState } from "react";
import { Search, Plus, Edit, Trash2, Eye, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: "active" | "inactive" | "out-of-stock";
  image: string;
}

interface ProductGridProps {
  products?: Product[];
  onProductClick?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

// TODO: remove mock data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: 29999000,
    stock: 12,
    category: "Điện thoại",
    status: "active",
    image: "/placeholder-product.jpg",
  },
  {
    id: "2", 
    name: "Samsung Galaxy S24",
    price: 22999000,
    stock: 0,
    category: "Điện thoại",
    status: "out-of-stock",
    image: "/placeholder-product.jpg",
  },
  {
    id: "3",
    name: "MacBook Pro M3",
    price: 49999000,
    stock: 8,
    category: "Laptop",
    status: "active", 
    image: "/placeholder-product.jpg",
  },
  {
    id: "4",
    name: "AirPods Pro 2",
    price: 5999000,
    stock: 25,
    category: "Phụ kiện",
    status: "active",
    image: "/placeholder-product.jpg",
  },
  {
    id: "5",
    name: "iPad Air M2",
    price: 15999000,
    stock: 15,
    category: "Tablet",
    status: "active",
    image: "/placeholder-product.jpg",
  },
  {
    id: "6",
    name: "Apple Watch Series 9",
    price: 9999000,
    stock: 3,
    category: "Smartwatch",
    status: "active",
    image: "/placeholder-product.jpg",
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

const getStatusBadge = (status: string, stock: number) => {
  if (status === "out-of-stock" || stock === 0) {
    return <Badge variant="destructive">Hết hàng</Badge>;
  }
  if (stock < 5) {
    return <Badge variant="secondary">Sắp hết</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800">Còn hàng</Badge>;
};

export function ProductGrid({ 
  products = mockProducts, 
  onProductClick, 
  onEditProduct, 
  onDeleteProduct 
}: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(new Set(products.map(p => p.category)));
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductAction = (action: string, product: Product) => {
    console.log(`${action} triggered for product:`, product.name);
    switch (action) {
      case "view":
        onProductClick?.(product);
        break;
      case "edit":
        onEditProduct?.(product);
        break;
      case "delete":
        onDeleteProduct?.(product);
        break;
    }
  };

  return (
    <div className="space-y-6" data-testid="product-grid">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sản phẩm</h2>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm của bạn</p>
        </div>
        <Button data-testid="button-add-product" onClick={() => console.log('Add product triggered')}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-filter-category">
              <Filter className="h-4 w-4 mr-2" />
              {selectedCategory === "all" ? "Tất cả danh mục" : selectedCategory}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
              Tất cả danh mục
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem 
                key={category} 
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Product Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover-elevate group" data-testid={`product-card-${product.id}`}>
            <CardContent className="p-4">
              <div className="aspect-square rounded-lg bg-muted mb-4 relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    target.parentElement!.innerHTML = `<div class="flex items-center justify-center h-full text-white font-medium">${product.name.substring(0, 2).toUpperCase()}</div>`;
                  }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/80">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleProductAction("view", product)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleProductAction("edit", product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleProductAction("delete", product)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  {getStatusBadge(product.status, product.stock)}
                </div>
                
                <p className="text-xs text-muted-foreground">{product.category}</p>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary" data-testid={`product-price-${product.id}`}>
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`product-stock-${product.id}`}>
                    Kho: {product.stock}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
        </div>
      )}
    </div>
  );
}