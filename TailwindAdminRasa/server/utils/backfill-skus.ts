import { storage } from '../storage';
import { generateSKU } from './sku-generator';

async function backfillSKUs() {
  console.log('🔄 Starting SKU backfill process...');
  
  try {
    // Get all products without SKUs
    const productsNeedingSKU = await storage.getProductsWithoutSKU();
    console.log(`📦 Found ${productsNeedingSKU.length} products needing SKUs`);
    
    if (productsNeedingSKU.length === 0) {
      console.log('✅ All products already have SKUs!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of productsNeedingSKU) {
      try {
        // For products without category, we need to handle them differently
        // Since generateSKU expects categoryId, we'll create SKU manually for products without category
        if (!product.categoryId) {
          // Generate SKU manually for products without category using "Khác" (Other) prefix
          const prefix = "KH"; // "Khác" -> "KH"
          let attempts = 0;
          let sku: string;
          let isUnique = false;
          
          while (!isUnique && attempts < 10) {
            const randomNumber = Math.floor(1000 + Math.random() * 9000);
            sku = `${prefix}${randomNumber}`;
            
            const existingProduct = await storage.getProductBySKU(sku!);
            if (!existingProduct) {
              isUnique = true;
              await storage.updateProduct(product.id, { sku: sku! });
              console.log(`✅ Generated SKU ${sku} for uncategorized product: ${product.name}`);
              successCount++;
              break;
            }
            attempts++;
          }
          
          if (!isUnique) {
            console.error(`❌ Could not generate unique SKU for uncategorized product ${product.id} after 10 attempts`);
            errorCount++;
          }
        } else {
          // Use generateSKU for products with category
          try {
            const sku = await generateSKU(product.categoryId);
            await storage.updateProduct(product.id, { sku });
            console.log(`✅ Generated SKU ${sku} for product: ${product.name}`);
            successCount++;
          } catch (skuError) {
            console.error(`❌ SKU generation failed for product ${product.id}:`, skuError);
            errorCount++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${product.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Backfill Summary:`);
    console.log(`✅ Success: ${successCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    
    // Verify results
    const remainingProducts = await storage.getProductsWithoutSKU();
    console.log(`🔍 Products still missing SKU: ${remainingProducts.length}`);
    
    if (remainingProducts.length === 0) {
      console.log('🎉 SKU backfill completed successfully! All products now have SKUs.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during SKU backfill:', error);
    process.exit(1);
  }
}

// Run backfill if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillSKUs()
    .then(() => {
      console.log('✨ SKU backfill process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 SKU backfill failed:', error);
      process.exit(1);
    });
}

export { backfillSKUs };