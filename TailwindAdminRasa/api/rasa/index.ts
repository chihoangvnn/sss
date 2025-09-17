import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { action } = req.query;

    if (action === 'catalogs') {
      // RASA catalogs endpoint
      const catalogs = [
        {
          id: "cat-electronics",
          name: "Điện tử",
          description: "Thiết bị điện tử, smartphone, laptop",
          sortOrder: 1
        },
        {
          id: "cat-fashion", 
          name: "Thời trang",
          description: "Quần áo, giày dép, phụ kiện",
          sortOrder: 2
        },
        {
          id: "cat-home",
          name: "Gia dụng", 
          description: "Đồ gia dụng, nội thất",
          sortOrder: 3
        }
      ];

      res.json({
        status: "success",
        data: catalogs
      });

    } else if (action === 'products') {
      // RASA products search endpoint
      const { q: searchTerm, limit = "10" } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu từ khóa tìm kiếm"
        });
      }

      // Get all products and filter by search term
      const allProducts = await storage.getProducts(100);
      const searchLower = (searchTerm as string).toLowerCase();
      
      const filteredProducts = allProducts
        .filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower))
        )
        .slice(0, parseInt(limit as string));

      // Map to RASA format
      const rasaProducts = filteredProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: parseFloat(product.price),
        unit: "cái",
        minOrderQuantity: 1,
        catalogId: "cat-electronics", // Default catalog
        subCatalogId: null,
        images: product.image ? [product.image] : ["/placeholder-product.jpg"],
        tags: [],
        sku: product.id
      }));

      res.json({
        status: "success",
        data: rasaProducts
      });

    } else {
      res.status(400).json({ 
        status: "error", 
        message: "Thiếu tham số 'action'. Sử dụng: ?action=catalogs hoặc ?action=products&q=keyword" 
      });
    }

  } catch (error) {
    console.error("RASA API Error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Lỗi hệ thống RASA API" 
    });
  }
}