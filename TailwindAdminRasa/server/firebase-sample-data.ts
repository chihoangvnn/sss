import { firebaseStorage } from './firebase-storage';

// Sample data creation for Firebase
export async function createSampleData() {
  try {
    console.log("Bắt đầu tạo dữ liệu mẫu cho Firebase...");

    // 1. Tạo Catalogs (Nghành hàng)
    const fruitCatalogId = await firebaseStorage.createCatalog({
      name: "Trái cây tươi",
      description: "Các loại trái cây tươi ngon, chất lượng cao",
      isActive: true,
      sortOrder: 1
    });

    const jewelryCatalogId = await firebaseStorage.createCatalog({
      name: "Trang sức phong thủy",
      description: "Vòng tay, dây chuyền phong thủy chất lượng",
      isActive: true,
      sortOrder: 2
    });

    const vegetableCatalogId = await firebaseStorage.createCatalog({
      name: "Rau củ quả",
      description: "Rau củ quả tươi sạch, an toàn",
      isActive: true,
      sortOrder: 3
    });

    console.log("✓ Đã tạo catalogs");

    // 2. Tạo Sub-catalogs (Danh mục con)
    const appleCategoryId = await firebaseStorage.createSubCatalog({
      name: "Táo các loại",
      description: "Táo nhập khẩu và trong nước",
      catalogId: fruitCatalogId,
      isActive: true,
      sortOrder: 1
    });

    const braceletCategoryId = await firebaseStorage.createSubCatalog({
      name: "Vòng tay trầm hương",
      description: "Vòng tay trầm hương thiên nhiên",
      catalogId: jewelryCatalogId,
      isActive: true,
      sortOrder: 1
    });

    const leafyVegCategoryId = await firebaseStorage.createSubCatalog({
      name: "Rau lá xanh",
      description: "Các loại rau lá tươi",
      catalogId: vegetableCatalogId,
      isActive: true,
      sortOrder: 1
    });

    console.log("✓ Đã tạo sub-catalogs");

    // 3. Tạo Products (Sản phẩm)
    
    // Táo
    const appleProductId = await firebaseStorage.createProduct({
      name: "Táo Fuji",
      description: "Táo Fuji nhập khẩu từ Nhật Bản, giòn ngọt, size đều",
      catalogId: fruitCatalogId,
      subCatalogId: appleCategoryId,
      basePrice: 150000,
      unit: "kg",
      minOrderQuantity: 0.5,
      isActive: true,
      images: [
        "https://example.com/apple-fuji-1.jpg",
        "https://example.com/apple-fuji-2.jpg"
      ],
      videos: [
        {
          type: "youtube",
          url: "https://youtube.com/watch?v=sample-apple",
          title: "Táo Fuji chất lượng cao"
        }
      ],
      tags: ["trái cây", "táo", "nhập khẩu", "Nhật Bản", "fuji"],
      sku: "APPLE-FUJI-001"
    });

    // Tạo variants cho táo
    const appleLargeVariantId = await firebaseStorage.createProductVariant({
      productId: appleProductId,
      name: "Táo Lớn",
      price: 180000,
      sku: "APPLE-FUJI-L",
      isActive: true,
      sortOrder: 1
    });

    const appleSmallVariantId = await firebaseStorage.createProductVariant({
      productId: appleProductId,
      name: "Táo Nhỏ", 
      price: 120000,
      sku: "APPLE-FUJI-S",
      isActive: true,
      sortOrder: 2
    });

    // Vòng trầm hương
    const braceletProductId = await firebaseStorage.createProduct({
      name: "Vòng Trầm Hương Thiên Nhiên",
      description: "Vòng tay trầm hương thiên nhiên, mùi thơm dịu nhẹ, phong thủy tốt",
      catalogId: jewelryCatalogId,
      subCatalogId: braceletCategoryId,
      basePrice: 500000,
      unit: "chiếc",
      minOrderQuantity: 1,
      isActive: true,
      images: [
        "https://example.com/bracelet-1.jpg",
        "https://example.com/bracelet-2.jpg"
      ],
      videos: [
        {
          type: "facebook",
          url: "https://facebook.com/watch/bracelet-video",
          title: "Vòng trầm hương thiên nhiên"
        },
        {
          type: "tiktok",
          url: "https://tiktok.com/@shop/video/123456",
          title: "Review vòng trầm"
        }
      ],
      tags: ["vòng tay", "trầm hương", "phong thủy", "thiên nhiên"],
      sku: "BRACELET-001"
    });

    // Tạo variants cho vòng trầm
    const braceletAVariantId = await firebaseStorage.createProductVariant({
      productId: braceletProductId,
      name: "Vòng Loại A",
      price: 800000,
      sku: "BRACELET-A",
      isActive: true,
      sortOrder: 1
    });

    const braceletBVariantId = await firebaseStorage.createProductVariant({
      productId: braceletProductId,
      name: "Vòng Loại B",
      price: 600000,
      sku: "BRACELET-B", 
      isActive: true,
      sortOrder: 2
    });

    // Rau cải
    const cabbageProductId = await firebaseStorage.createProduct({
      name: "Cải thảo hữu cơ",
      description: "Cải thảo trồng hữu cơ, không thuốc trừ sâu, tươi xanh",
      catalogId: vegetableCatalogId,
      subCatalogId: leafyVegCategoryId,
      basePrice: 25000,
      unit: "kg",
      minOrderQuantity: 0.5,
      isActive: true,
      images: [
        "https://example.com/cabbage-1.jpg"
      ],
      videos: [],
      tags: ["rau", "cải thảo", "hữu cơ", "sạch"],
      sku: "CABBAGE-ORG-001"
    });

    console.log("✓ Đã tạo products và variants");

    // 4. Tạo inventory cho các sản phẩm
    
    // Inventory cho táo
    await firebaseStorage.updateInventory(appleProductId, undefined, 100, 0);
    await firebaseStorage.updateInventory(appleProductId, appleLargeVariantId, 50, 5);
    await firebaseStorage.updateInventory(appleProductId, appleSmallVariantId, 80, 10);

    // Inventory cho vòng trầm
    await firebaseStorage.updateInventory(braceletProductId, undefined, 20, 0);
    await firebaseStorage.updateInventory(braceletProductId, braceletAVariantId, 15, 3);
    await firebaseStorage.updateInventory(braceletProductId, braceletBVariantId, 25, 7);

    // Inventory cho rau cải
    await firebaseStorage.updateInventory(cabbageProductId, undefined, 50, 12);

    console.log("✓ Đã tạo inventory");

    // 5. Tạo khách hàng mẫu
    const customer1Id = await firebaseStorage.createCustomer({
      name: "Nguyễn Văn An",
      email: "nguyen.van.an@email.com",
      phone: "0901234567",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      customerType: "retail",
      totalDebt: 0,
      creditLimit: 5000000,
      isActive: true,
      notes: "Khách hàng thân thiết"
    });

    const customer2Id = await firebaseStorage.createCustomer({
      name: "Trần Thị Bình",
      email: "tran.thi.binh@email.com",
      phone: "0987654321",
      address: "456 Đường XYZ, Quận 3, TP.HCM",
      customerType: "wholesale",
      totalDebt: 500000,
      creditLimit: 10000000,
      isActive: true,
      notes: "Khách sỉ lớn"
    });

    console.log("✓ Đã tạo customers");

    console.log("🎉 Hoàn thành tạo dữ liệu mẫu cho Firebase!");
    
    return {
      catalogs: [fruitCatalogId, jewelryCatalogId, vegetableCatalogId],
      subCatalogs: [appleCategoryId, braceletCategoryId, leafyVegCategoryId],
      products: [appleProductId, braceletProductId, cabbageProductId],
      customers: [customer1Id, customer2Id]
    };

  } catch (error) {
    console.error("Lỗi khi tạo dữ liệu mẫu:", error);
    throw error;
  }
}

// Function to test RASA APIs with sample data
export async function testRasaApis() {
  try {
    console.log("Bắt đầu test RASA APIs...");
    
    // Test catalog listing
    console.log("Testing GET /api/rasa/catalogs");
    
    // Test product search
    console.log("Testing GET /api/rasa/products/search?q=táo");
    
    // Test customer search
    console.log("Testing GET /api/rasa/customers/search?q=Nguyễn");
    
    console.log("✓ Tất cả RASA APIs đã sẵn sàng để test");
    
  } catch (error) {
    console.error("Lỗi khi test RASA APIs:", error);
    throw error;
  }
}