import { ShopeeProductGrid } from "@/components/ShopeeProductGrid";
import { PublicMobileLayout } from "@/layouts/PublicMobileLayout";

export default function ShopeeHomePage() {
  return (
    <PublicMobileLayout>
      <ShopeeProductGrid 
        onProductClick={(product) => {
          console.log('Product clicked:', product.name);
          // TODO: Navigate to product detail page
        }}
        onAddToCart={(product) => {
          console.log('Add to cart:', product.name);
          // TODO: Add to cart functionality
        }}
        onLikeProduct={(product) => {
          console.log('Like product:', product.name);
          // TODO: Save to wishlist
        }}
      />
    </PublicMobileLayout>
  );
}