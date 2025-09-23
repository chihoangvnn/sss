import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { db } from '../../server/db';

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

    } else if (action === 'detect-industry') {
      // 🤖 AI Industry Detection - CORE API
      const { q: text } = req.query;
      
      if (!text) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu text để phân tích ngành hàng"
        });
      }

      try {
        const textLower = (text as string).toLowerCase().trim();
        
        // Get all industry keywords
        const allKeywords = await db.execute(`
          SELECT 
            ik.industry_id,
            ik.keyword,
            ik.weight,
            i.name as industry_name
          FROM industry_keywords ik
          JOIN industries i ON ik.industry_id = i.id
          WHERE ik.is_active = true AND i.is_active = true
        `);

        // Calculate scores for each industry
        const industryScores: { [key: string]: { score: number; matches: string[]; name: string } } = {};

        for (const kw of allKeywords) {
          const keyword = kw.keyword.toLowerCase();
          if (textLower.includes(keyword)) {
            if (!industryScores[kw.industry_id]) {
              industryScores[kw.industry_id] = { 
                score: 0, 
                matches: [], 
                name: kw.industry_name 
              };
            }
            industryScores[kw.industry_id].score += parseFloat(kw.weight);
            industryScores[kw.industry_id].matches.push(kw.keyword);
          }
        }

        // Sort by score and calculate confidence
        const sortedIndustries = Object.entries(industryScores)
          .map(([id, data]) => ({
            industryId: id,
            industryName: data.name,
            confidence: Math.min(data.score / 10, 0.95), // Cap at 95%
            score: data.score,
            matchedKeywords: data.matches
          }))
          .sort((a, b) => b.score - a.score);

        const detected = sortedIndustries.length > 0 ? sortedIndustries[0] : null;

        res.json({
          status: "success",
          data: {
            text: text,
            detected: detected,
            alternatives: sortedIndustries.slice(1, 3), // Top 2 alternatives
            confidence: detected ? detected.confidence : 0,
            algorithm: "keyword-matching-v1"
          }
        });

      } catch (error) {
        console.error("Industry detection error:", error);
        res.status(500).json({
          status: "error",
          message: "Lỗi phân tích ngành hàng"
        });
      }

    } else if (action === 'industries') {
      // Get all active industries
      try {
        const industries = await db.execute(`
          SELECT id, name, description, sort_order, created_at
          FROM industries 
          WHERE is_active = true 
          ORDER BY sort_order ASC, name ASC
        `);

        res.json({
          status: "success",
          data: industries
        });

      } catch (error) {
        console.error("Industries fetch error:", error);
        res.status(500).json({
          status: "error",
          message: "Lỗi lấy danh sách ngành hàng"
        });
      }

    } else if (action === 'keywords') {
      // Get keywords for specific industry
      const { industryId } = req.query;
      
      if (!industryId) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu industryId"
        });
      }

      try {
        const keywords = await db.execute(`
          SELECT keyword, weight, is_active
          FROM industry_keywords 
          WHERE industry_id = $1 AND is_active = true
          ORDER BY weight DESC, keyword ASC
        `, [industryId]);

        res.json({
          status: "success",
          data: {
            industryId: industryId,
            keywords: keywords
          }
        });

      } catch (error) {
        console.error("Keywords fetch error:", error);
        res.status(500).json({
          status: "error",
          message: "Lỗi lấy keywords ngành hàng"
        });
      }

    } else if (action === 'templates') {
      // Get response templates for specific industry
      const { industryId, intent } = req.query;
      
      if (!industryId) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu industryId"
        });
      }

      try {
        let query = `
          SELECT intent, template, language, priority
          FROM industry_templates 
          WHERE industry_id = $1 AND is_active = true
        `;
        let params = [industryId];

        if (intent) {
          query += ` AND intent = $2`;
          params.push(intent as string);
        }

        query += ` ORDER BY priority DESC, intent ASC`;

        const templates = await db.execute(query, params);

        res.json({
          status: "success",
          data: {
            industryId: industryId,
            intent: intent || "all",
            templates: templates
          }
        });

      } catch (error) {
        console.error("Templates fetch error:", error);
        res.status(500).json({
          status: "error",
          message: "Lỗi lấy templates ngành hàng"
        });
      }

    } else {
      res.status(400).json({ 
        status: "error", 
        message: "Thiếu tham số 'action'. Sử dụng: ?action=catalogs|products|detect-industry|industries|keywords|templates" 
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