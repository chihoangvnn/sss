import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * 🤖 RASA Industry Detection API
 * Handles intelligent industry detection and template management for Vietnamese retail chatbot
 */

// GET /api/rasa/detect-industry?q=text - CORE Detection API
router.get('/detect-industry', async (req, res) => {
  try {
    const { q: text } = req.query;
    
    if (!text) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu text để phân tích ngành hàng"
      });
    }

    const textLower = (text as string).toLowerCase().trim();
    
    // Vietnamese text normalization function - removes diacritics for better matching
    const normalizeVietnamese = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
    };

    const textNormalized = normalizeVietnamese(textLower);

    // Get all industry keywords
    const allKeywordsResult = await db.execute(`
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

    if (!allKeywordsResult.rows || !Array.isArray(allKeywordsResult.rows)) {
      return res.json({
        status: "success",
        data: {
          text: text,
          detected: null,
          alternatives: [],
          confidence: 0,
          algorithm: "vietnamese-keyword-matching-v1"
        }
      });
    }

    for (const kw of allKeywordsResult.rows) {
      const keywordNormalized = normalizeVietnamese(kw.keyword);
      
      // Check both original and normalized text for maximum matching accuracy
      if (textLower.includes(kw.keyword.toLowerCase()) || 
          textNormalized.includes(keywordNormalized)) {
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
        algorithm: "vietnamese-keyword-matching-v1"
      }
    });

  } catch (error) {
    console.error("Industry detection error:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi phân tích ngành hàng"
    });
  }
});

// GET /api/rasa/industries - List all industries
router.get('/industries', async (req, res) => {
  try {
    const industriesResult = await db.execute(`
      SELECT id, name, description, sort_order, created_at
      FROM industries 
      WHERE is_active = true 
      ORDER BY sort_order ASC, name ASC
    `);

    res.json({
      status: "success",
      data: industriesResult.rows
    });

  } catch (error) {
    console.error("Industries fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi lấy danh sách ngành hàng"
    });
  }
});

// GET /api/rasa/keywords/:industryId - Get keywords for specific industry
router.get('/keywords/:industryId', async (req, res) => {
  try {
    const { industryId } = req.params;
    
    const keywordsResult = await db.execute(
      sql`SELECT keyword, weight, is_active
          FROM industry_keywords 
          WHERE industry_id = ${industryId} AND is_active = true
          ORDER BY weight DESC, keyword ASC`
    );

    res.json({
      status: "success",
      data: {
        industryId: industryId,
        keywords: keywordsResult.rows
      }
    });

  } catch (error) {
    console.error("Keywords fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi lấy keywords ngành hàng"
    });
  }
});

// GET /api/rasa/templates/:industryId - Get response templates for specific industry
router.get('/templates/:industryId', async (req, res) => {
  try {
    const { industryId } = req.params;
    const { intent } = req.query;
    
    let baseQuery = sql`SELECT intent, template, language, priority
                        FROM industry_templates 
                        WHERE industry_id = ${industryId} AND is_active = true`;
    
    if (intent) {
      baseQuery = sql`${baseQuery} AND intent = ${intent}`;
    }
    
    const finalQuery = sql`${baseQuery} ORDER BY priority DESC, intent ASC`;
    const templatesResult = await db.execute(finalQuery);

    res.json({
      status: "success",
      data: {
        industryId: industryId,
        intent: intent || "all",
        templates: templatesResult.rows
      }
    });

  } catch (error) {
    console.error("Templates fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi lấy templates ngành hàng"
    });
  }
});

export default router;