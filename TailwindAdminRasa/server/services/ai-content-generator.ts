import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ContentVariation {
  variation: string;
  tone: string;
  platform: string;
  hashtags?: string[];
  length: 'short' | 'medium' | 'long';
}

export interface GenerateVariationsRequest {
  baseContent: string;
  platforms: string[];
  tones?: string[];
  variationsPerPlatform?: number;
  includeHashtags?: boolean;
  targetAudience?: string;
  contentType?: 'promotional' | 'educational' | 'entertainment' | 'news';
}

export interface GenerateVariationsResponse {
  variations: ContentVariation[];
  totalGenerated: number;
  platforms: string[];
  baseContent: string;
}

export class AIContentGenerator {
  private async generateSingleVariation(
    baseContent: string,
    platform: string,
    tone: string,
    options: {
      includeHashtags?: boolean;
      targetAudience?: string;
      contentType?: string;
    } = {}
  ): Promise<ContentVariation> {
    const { includeHashtags = true, targetAudience = "general audience", contentType = "promotional" } = options;

    // Platform-specific requirements
    const platformSpecs = {
      facebook: {
        maxLength: 2000,
        style: "engaging and conversational",
        features: "supports long-form content, stories, and multimedia"
      },
      instagram: {
        maxLength: 2200,
        style: "visual-first with compelling captions",
        features: "hashtag-heavy, story-friendly, visual storytelling"
      },
      twitter: {
        maxLength: 280,
        style: "concise and punchy",
        features: "thread-capable, hashtag strategic, real-time conversation"
      },
      tiktok: {
        maxLength: 150,
        style: "trendy and hook-focused",
        features: "video-first, trending sounds, viral challenges"
      }
    };

    const spec = platformSpecs[platform as keyof typeof platformSpecs] || platformSpecs.facebook;

    const systemPrompt = `You are an expert social media content creator specializing in ${platform} content optimization.

PLATFORM SPECIFICATIONS:
- Platform: ${platform.toUpperCase()}
- Max length: ${spec.maxLength} characters
- Style: ${spec.style}
- Platform features: ${spec.features}

CONTENT REQUIREMENTS:
- Tone: ${tone}
- Target audience: ${targetAudience}
- Content type: ${contentType}
- Include hashtags: ${includeHashtags ? 'Yes' : 'No'}

TASK:
Transform the following base content into a ${platform}-optimized variation that:
1. Maintains the core message but adapts to ${platform}'s unique style
2. Uses ${tone} tone throughout
3. Stays within ${spec.maxLength} characters
4. ${includeHashtags ? 'Includes 3-5 relevant hashtags' : 'Excludes hashtags'}
5. Optimizes for ${platform} engagement patterns

Respond with JSON in this exact format:
{
  "variation": "the optimized content text",
  "tone": "${tone}",
  "platform": "${platform}",
  "hashtags": ${includeHashtags ? '["hashtag1", "hashtag2", "hashtag3"]' : '[]'},
  "length": "short/medium/long based on character count"
}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              variation: { type: "string" },
              tone: { type: "string" },
              platform: { type: "string" },
              hashtags: {
                type: "array",
                items: { type: "string" }
              },
              length: {
                type: "string",
                enum: ["short", "medium", "long"]
              }
            },
            required: ["variation", "tone", "platform", "hashtags", "length"]
          }
        },
        contents: `Base content to transform:\n\n${baseContent}`
      });

      const rawJson = response.text;
      
      if (rawJson) {
        try {
          const variation: ContentVariation = JSON.parse(rawJson);
          
          // Validate and enforce platform limits
          const maxLengths = { facebook: 2000, instagram: 2200, twitter: 280, tiktok: 150 };
          const maxLength = maxLengths[platform as keyof typeof maxLengths] || 2000;
          
          if (variation.variation && variation.variation.length > maxLength) {
            variation.variation = variation.variation.substring(0, maxLength - 3) + '...';
          }
          
          // Set length category
          const length = variation.variation.length;
          variation.length = length <= 100 ? 'short' : length <= 300 ? 'medium' : 'long';
          
          return variation;
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError, 'Raw response:', rawJson);
          // Fallback: create manual variation
          return {
            variation: baseContent.substring(0, spec.maxLength),
            tone,
            platform,
            hashtags: [],
            length: 'medium'
          };
        }
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (error) {
      console.error(`Failed to generate variation for ${platform} with ${tone} tone:`, error);
      throw new Error(`AI content generation failed: ${error}`);
    }
  }

  async generateVariations(request: GenerateVariationsRequest): Promise<GenerateVariationsResponse> {
    const {
      baseContent,
      platforms,
      tones = ['professional', 'casual', 'engaging'],
      variationsPerPlatform = 2,
      includeHashtags = true,
      targetAudience = 'general audience',
      contentType = 'promotional'
    } = request;

    if (!baseContent || baseContent.trim().length === 0) {
      throw new Error("Base content is required and cannot be empty");
    }

    if (!platforms || platforms.length === 0) {
      throw new Error("At least one platform must be specified");
    }

    const supportedPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok'];
    const invalidPlatforms = platforms.filter(p => !supportedPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      throw new Error(`Unsupported platforms: ${invalidPlatforms.join(', ')}. Supported: ${supportedPlatforms.join(', ')}`);
    }

    const variations: ContentVariation[] = [];
    const generationPromises: Promise<ContentVariation>[] = [];

    // Generate variations for each platform and tone combination
    for (const platform of platforms) {
      for (let i = 0; i < variationsPerPlatform; i++) {
        const tone = tones[i % tones.length]; // Cycle through tones
        
        const promise = this.generateSingleVariation(baseContent, platform, tone, {
          includeHashtags,
          targetAudience,
          contentType
        });
        
        generationPromises.push(promise);
      }
    }

    try {
      // Execute all generations in parallel for better performance
      const results = await Promise.allSettled(generationPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          variations.push(result.value);
        } else {
          console.error(`Variation generation ${index + 1} failed:`, result.reason);
        }
      });

      if (variations.length === 0) {
        throw new Error("All variation generations failed");
      }

      return {
        variations,
        totalGenerated: variations.length,
        platforms: Array.from(new Set(variations.map(v => v.platform))),
        baseContent
      };

    } catch (error) {
      console.error('Batch variation generation failed:', error);
      throw new Error(`Failed to generate content variations: ${error}`);
    }
  }

  async optimizeForPlatform(
    content: string,
    platform: string,
    tone: string = 'professional'
  ): Promise<ContentVariation> {
    if (!content || content.trim().length === 0) {
      throw new Error("Content is required for platform optimization");
    }

    const supportedPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok'];
    if (!supportedPlatforms.includes(platform)) {
      throw new Error(`Unsupported platform: ${platform}. Supported: ${supportedPlatforms.join(', ')}`);
    }

    return this.generateSingleVariation(content, platform, tone, {
      includeHashtags: true,
      targetAudience: 'general audience',
      contentType: 'promotional'
    });
  }

  async generateHashtags(content: string, platform: string, count: number = 5): Promise<string[]> {
    const systemPrompt = `You are a hashtag specialist for ${platform.toUpperCase()} social media.

Generate ${count} relevant, trending hashtags for the given content that will maximize reach and engagement on ${platform}.

Requirements:
- Return only hashtags (with # symbol)
- Mix of popular and niche hashtags
- Relevant to the content topic
- Platform-appropriate (${platform} best practices)
- No spaces in hashtags
- Respond with JSON array format

Respond with JSON in this format:
["#hashtag1", "#hashtag2", "#hashtag3", ...]`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: { type: "string" }
          }
        },
        contents: `Content for hashtag generation:\n\n${content}`
      });

      const rawJson = response.text;
      
      if (rawJson) {
        const hashtags: string[] = JSON.parse(rawJson);
        return hashtags.slice(0, count); // Ensure we don't exceed requested count
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (error) {
      console.error('Hashtag generation failed:', error);
      throw new Error(`Failed to generate hashtags: ${error}`);
    }
  }

  // 🛡️ Security-enhanced validation & normalization helpers for SEO data
  private sanitizeTitle(title: any, maxLength: number = 60): string {
    // Type safety: handle non-string inputs
    if (!title || typeof title !== 'string') {
      return "Sản Phẩm Chất Lượng";
    }
    
    // Strip HTML tags and dangerous content
    const cleanTitle = title
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces
    
    // Fallback if sanitization removes everything
    if (cleanTitle.length === 0) {
      return "Sản Phẩm Chất Lượng";
    }
    
    // Ensure within character limit
    if (cleanTitle.length > maxLength) {
      return cleanTitle.substring(0, maxLength - 3) + '...';
    }
    
    return cleanTitle;
  }

  private sanitizeDescription(description: any, maxLength: number = 160): string {
    // Type safety: handle non-string inputs
    if (!description || typeof description !== 'string') {
      return "Sản phẩm chất lượng cao, uy tín, giao hàng nhanh toàn quốc.";
    }
    
    // Strip HTML tags and dangerous content
    const cleanDesc = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces
    
    // Fallback if sanitization removes everything
    if (cleanDesc.length === 0) {
      return "Sản phẩm chất lượng cao, uy tín, giao hàng nhanh toàn quốc.";
    }
    
    // Ensure within character limit
    if (cleanDesc.length > maxLength) {
      return cleanDesc.substring(0, maxLength - 3) + '...';
    }
    
    return cleanDesc;
  }

  private sanitizeSlug(input: string, productName?: string): string {
    if (!input || input.trim().length === 0) {
      input = productName || "san-pham";
    }
    
    // Convert to lowercase and normalize Vietnamese diacritics
    const slug = input
      .toLowerCase()
      .trim()
      // Replace Vietnamese diacritics
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      // Remove non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9\s-]/g, '')
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-|-$/g, '');
    
    // Ensure slug is not empty
    if (slug.length === 0) {
      return 'san-pham';
    }
    
    // Limit slug length
    if (slug.length > 100) {
      return slug.substring(0, 100).replace(/-$/, '');
    }
    
    return slug;
  }

  private sanitizeKeywords(keywords: any): string[] {
    if (!Array.isArray(keywords)) {
      return ['chất lượng', 'uy tín', 'chính hãng'];
    }
    
    // Filter and clean keywords
    const cleanKeywords = keywords
      .filter(keyword => typeof keyword === 'string' && keyword.trim().length > 0)
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length <= 50) // Max keyword length
      .slice(0, 12); // Max 12 keywords
    
    // Ensure minimum number of keywords
    if (cleanKeywords.length === 0) {
      return ['chất lượng', 'uy tín', 'chính hãng'];
    }
    
    return cleanKeywords;
  }

  // 🔍 NEW: SEO Generation for Vietnamese E-commerce
  async generateSEOData(
    productName: string,
    productDescription?: string,
    category?: string,
    options: {
      targetMarket?: 'vietnam' | 'international';
      includeLocalKeywords?: boolean;
      ecommerceType?: 'fashion' | 'cosmetics' | 'supplements' | 'electronics' | 'food' | 'general';
    } = {}
  ): Promise<{
    seo_title: string;
    seo_description: string;
    slug: string;
    keywords: string[];
    og_title?: string;
    og_description?: string;
  }> {
    // Input validation
    if (!productName || productName.trim().length === 0) {
      throw new Error("Product name is required for SEO generation");
    }

    const { 
      targetMarket = 'vietnam',
      includeLocalKeywords = true,
      ecommerceType = 'general'
    } = options;

    // Vietnamese e-commerce SEO intelligence
    const vietnameseEcommerceContext = `
🇻🇳 VIETNAMESE E-COMMERCE SEO OPTIMIZATION CONTEXT:

TARGET MARKET: ${targetMarket === 'vietnam' ? 'Thị trường Việt Nam' : 'International with Vietnamese focus'}
CATEGORY: ${ecommerceType.toUpperCase()}
LOCAL OPTIMIZATION: ${includeLocalKeywords ? 'Include Vietnamese search behavior patterns' : 'Basic optimization'}

VIETNAMESE SEARCH PATTERNS:
- Search intent: "mua [product]", "giá [product]", "[product] chính hãng", "[product] review"
- Local terms: "giao hàng tận nơi", "thanh toán khi nhận hàng", "bảo hành"
- Trust signals: "chính hãng", "uy tín", "đáng tin cậy", "được khuyên dùng"
- Price sensitivity: "giá rẻ", "khuyến mãi", "giảm giá", "sale off"

CATEGORY-SPECIFIC KEYWORDS:
${ecommerceType === 'cosmetics' ? '- Cosmetics: "mỹ phẩm", "làm đẹp", "skincare", "chăm sóc da", "anti-aging"' : ''}
${ecommerceType === 'supplements' ? '- Supplements: "thực phẩm chức năng", "vitamin", "tăng cường sức khỏe", "bổ sung dinh dưỡng"' : ''}
${ecommerceType === 'electronics' ? '- Electronics: "điện tử", "công nghệ", "chính hãng", "bảo hành", "mới nhất"' : ''}
${ecommerceType === 'fashion' ? '- Fashion: "thời trang", "xu hướng", "phong cách", "trendy", "hot trend"' : ''}
${ecommerceType === 'food' ? '- Food: "thực phẩm", "đặc sản", "tươi ngon", "an toàn", "sạch"' : ''}

SEO BEST PRACTICES FOR VIETNAM:
- Title length: 50-60 characters (Vietnamese reads faster)
- Description: 150-160 characters with compelling CTA
- Include year "2024/2025" for freshness signals
- Local trust signals and shipping promises
- Mobile-first optimization (80%+ mobile traffic in VN)
`;

    const systemPrompt = `Bạn là chuyên gia SEO e-commerce chuyên nghiệp cho thị trường Việt Nam.

${vietnameseEcommerceContext}

NHIỆM VỤ:
Tạo bộ SEO data hoàn chỉnh cho sản phẩm "${productName}"
${category ? `Thuộc danh mục: "${category}"` : ''}
${productDescription ? `Mô tả: "${productDescription}"` : ''}

YÊU CẦU CHẤT LƯỢNG:
✅ SEO Title: 50-60 ký tự, có keyword chính, compelling, có year 2024/2025
✅ SEO Description: 150-160 ký tự, có CTA mạnh, benefit-focused
✅ Slug: URL-friendly, Vietnamese → English, SEO-optimized  
✅ Keywords: 8-12 keywords phù hợp search intent Việt Nam
✅ OG Title: Social media optimized, engaging hơn SEO title
✅ OG Description: Facebook/Zalo friendly, call-to-action mạnh

CÔNG THỨC SEO TITLE HIỆU QUẢ:
- Pattern 1: "[Product] [Brand/Type] - [Main Benefit] | [Trust Signal] 2024"
- Pattern 2: "[Product] [Category] [Location] - [Price Point] | [Guarantee]"
- Pattern 3: "Mua [Product] [Quality] - [Benefit] | [Shipping Promise]"

VÍ DỤ THỰC TẾ:
Product: "Serum Vitamin C"
- SEO Title: "Serum Vitamin C Chính Hãng - Trắng Da Nhanh | Uy Tín 2024"  
- SEO Description: "⭐ Serum Vitamin C làm trắng da tự nhiên, an toàn. Giao hàng miễn phí toàn quốc. Đặt ngay để nhận ưu đãi!"
- Slug: "serum-vitamin-c-chinh-hang-trang-da"
- Keywords: ["serum vitamin c", "mỹ phẩm trắng da", "vitamin c chính hãng", ...]

QUAN TRỌNG: Tất cả content phải:
1. Tự nhiên, không stuffing keywords
2. Phù hợp search intent của người Việt
3. Có trust signals và urgency
4. Optimized cho mobile experience
5. Include local shipping/payment terms

Trả về JSON format:`;

    const responseSchema = {
      type: "object",
      properties: {
        seo_title: { type: "string" },
        seo_description: { type: "string" },
        slug: { type: "string" },
        keywords: {
          type: "array",
          items: { type: "string" }
        },
        og_title: { type: "string" },
        og_description: { type: "string" }
      },
      required: ["seo_title", "seo_description", "slug", "keywords", "og_title", "og_description"]
    };

    try {
      // 🔁 Retry logic with exponential backoff for API overload
      let attempt = 0;
      const maxRetries = 3;
      let response;
      
      while (attempt < maxRetries) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema
            },
            contents: `
            SẢN PHẨM CẦN TỐI ƯU SEO:
            - Tên: "${productName}"
            ${category ? `- Danh mục: "${category}"` : ''}
            ${productDescription ? `- Mô tả: "${productDescription}"` : ''}
            
            Hãy tạo bộ SEO data hoàn chỉnh theo yêu cầu, tập trung vào:
            1. Keywords phù hợp với search behavior của người Việt
            2. Trust signals và local optimization
            3. Compelling copy để tăng CTR
            4. Mobile-friendly content
            `
          });
          break; // Success, exit retry loop
        } catch (retryError: any) {
          attempt++;
          console.log(`🔄 SEO API attempt ${attempt}/${maxRetries} failed:`, retryError.message);
          
          if (attempt >= maxRetries) {
            // Max retries reached, throw error to trigger fallback
            throw retryError;
          }
          
          // Exponential backoff: wait 2^attempt seconds
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`⏰ Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      const rawJson = response.text;
      
      if (rawJson) {
        try {
          const result = JSON.parse(rawJson);
          
          // 🛡️ Apply comprehensive sanitization and validation
          const sanitizedSEOData = {
            seo_title: this.sanitizeTitle(result.seo_title || productName),
            seo_description: this.sanitizeDescription(result.seo_description || productDescription || `Mua ${productName} chính hãng với giá tốt nhất`),
            slug: this.sanitizeSlug(result.slug || productName, productName),
            keywords: this.sanitizeKeywords(result.keywords || []),
            og_title: this.sanitizeTitle(result.og_title || result.seo_title || productName),
            og_description: this.sanitizeDescription(result.og_description || result.seo_description || `🔥 ${productName} hot nhất hiện nay! Đặt ngay để không bỏ lỡ cơ hội.`),
            meta_data: {
              target_market: options?.targetMarket || 'vietnam',
              generated_at: new Date().toISOString(),
              category: options?.ecommerceType || 'general',
              validation_passed: true
            }
          };
          
          return sanitizedSEOData;
          
        } catch (parseError) {
          console.error('Failed to parse SEO response:', parseError, 'Raw:', rawJson);
          
          // 🛡️ Fallback: generate basic SEO data using sanitization functions
          console.log('Using fallback SEO generation for:', productName);
            
          const fallbackSEOData = {
            seo_title: this.sanitizeTitle(`${productName} - Chất Lượng Cao | Uy Tín 2024`),
            seo_description: this.sanitizeDescription(`⭐ ${productName} chính hãng, chất lượng tốt. Giao hàng miễn phí toàn quốc. Đặt ngay!`),
            slug: this.sanitizeSlug(productName),
            keywords: this.sanitizeKeywords([productName.toLowerCase(), "chính hãng", "chất lượng", "uy tín"]),
            og_title: this.sanitizeTitle(`${productName} - Đáng Mua Nhất 2024`),
            og_description: this.sanitizeDescription(`🔥 ${productName} hot nhất hiện nay! Đặt ngay để không bỏ lỡ cơ hội.`),
            meta_data: {
              target_market: options?.targetMarket || 'vietnam',
              generated_at: new Date().toISOString(),
              category: options?.ecommerceType || 'general',
              validation_passed: true,
              fallback_used: true
            }
          };
          
          return fallbackSEOData;
        }
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (error) {
      console.error('SEO generation failed:', error);
      throw new Error(`Failed to generate SEO data: ${error}`);
    }
  }

  // 🤖 NEW: RASA Product Description Generator
  async generateProductDescriptions(
    productName: string,
    industryName?: string,
    categoryName?: string,
    options: {
      targetLanguage?: 'vietnamese' | 'english';
      customContext?: string;
      consultationData?: Record<string, string>; // 🧠 Add consultation data support
    } = {}
  ): Promise<{
    primary: string;
    rasa_variations: { [key: string]: string };
    contexts: { [key: string]: string };
  }> {
    // Input validation
    if (!productName || productName.trim().length === 0) {
      throw new Error("Product name is required and cannot be empty");
    }

    const { 
      targetLanguage = 'vietnamese',
      customContext = '',
      consultationData = {}
    } = options;

    // 🧠 Enhanced consultation context for professional descriptions
    let consultationGuidance = '';
    if (Object.keys(consultationData).length > 0) {
      const consultationEntries = Object.entries(consultationData)
        .filter(([_, value]) => value && typeof value === 'string' && value.trim())
        .map(([key, value]) => `- ${key}: ${value}`);
      
      if (consultationEntries.length > 0) {
        consultationGuidance = `\n\n🩺 THÔNG TIN TƯ VẤN CHUYÊN NGHIỆP (Sử dụng để tạo mô tả CHÍNH XÁC và THUYẾT PHỤC):
${consultationEntries.join('\n')}

⚡ QUAN TRỌNG: Sử dụng thông tin tư vấn này để tạo mô tả CHỜ TỎ HƠN, nhấn mạnh:
- Cách sử dụng chính xác
- Lợi ích thực tế mà khách hàng quan tâm
- Thông tin an toàn và lưu ý quan trọng
- Kết quả cụ thể mà khách hàng mong đợi`;
      }
    }

    const systemPrompt = `Bạn là chuyên gia viết mô tả sản phẩm chuyên nghiệp cho thương mại điện tử và chatbot RASA.

NHIỆM VỤ:
Tạo 1 mô tả chính + 4 biến thể benefit-focused cho sản phẩm "${productName}"
${industryName ? `Ngành hàng: "${industryName}"` : ''}
${categoryName ? `Danh mục: "${categoryName}"` : ''}
${customContext ? `Bối cảnh đặc biệt: "${customContext}"` : ''}${consultationGuidance}

YÊU CẦU CHẤT LƯỢNG:
✅ Ngôn ngữ: ${targetLanguage === 'vietnamese' ? 'Tiếng Việt tự nhiên, thân thiện' : 'Natural English'}
✅ Độ dài: 1-2 câu ngắn gọn, súc tích (max 120 từ)
✅ Tập trung: BENEFIT khách hàng nhận được, KHÔNG chỉ feature sản phẩm
✅ Cảm xúc: Kích thích mong muốn mua hàng, tạo động lực hành động
✅ Phù hợp: Context ngành hàng và nhóm khách hàng mục tiêu

4 BIẾN THỂ BENEFIT-FOCUSED:
0️⃣ SAFETY (An toàn/Tin cậy): Nhấn mạnh sự yên tâm, an toàn, đáng tin cậy
1️⃣ CONVENIENCE (Tiện lợi): Tập trung vào sự dễ dàng, tiết kiệm thời gian, thuận tiện
2️⃣ QUALITY (Chất lượng): Nhấn mạnh giá trị cao, độ bền, hiệu quả vượt trội
3️⃣ HEALTH (Sức khỏe/Hạnh phúc): Focus vào lợi ích sức khỏe, cảm xúc tích cực

VÍ DỤ THỰC TẾ:
Sản phẩm: "Rau cải hữu cơ"
- Primary: "Rau cải hữu cơ tươi ngon, an toàn cho cả gia đình"
- Safety: "Con ăn rau yên tâm, mẹ không lo thuốc trừ sâu"
- Convenience: "Nấu ăn dễ dàng, bữa cơm gia đình thêm ngon"
- Quality: "Tươi xanh từ vườn, chất lượng tuyệt vời mỗi ngày"
- Health: "Vitamin tự nhiên giúp con khỏe mạnh, thông minh"

QUAN TRỌNG: contexts phải trả về exact mapping:
{
  "safety": "0",
  "convenience": "1", 
  "quality": "2",
  "health": "3"
}

Trả về JSON đúng format:`;

    const responseSchema = {
      type: "object",
      properties: {
        primary: { type: "string" },
        rasa_variations: {
          type: "object",
          properties: {
            "0": { type: "string" },
            "1": { type: "string" },
            "2": { type: "string" },
            "3": { type: "string" }
          },
          required: ["0", "1", "2", "3"]
        },
        contexts: {
          type: "object",
          properties: {
            safety: { type: "string", enum: ["0"] },
            convenience: { type: "string", enum: ["1"] },
            quality: { type: "string", enum: ["2"] },
            health: { type: "string", enum: ["3"] }
          },
          required: ["safety", "convenience", "quality", "health"]
        }
      },
      required: ["primary", "rasa_variations", "contexts"]
    };

    // Retry logic with exponential backoff for Google API overload
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI Generation attempt ${attempt}/${maxRetries} for: ${productName}`);
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema
          },
          contents: `
          Sản phẩm cần tạo mô tả: "${productName}"
          ${industryName ? `Thuộc ngành hàng: "${industryName}"` : ''}
          ${categoryName ? `Danh mục: "${categoryName}"` : ''}
          
          Hãy tạo 1 mô tả chính + 4 biến thể benefit-focused theo format yêu cầu.
          
          Lưu ý: Mỗi mô tả phải khác biệt rõ ràng, tập trung vào benefit cụ thể.
          `
        });
        
        // If we get here, the request succeeded
        console.log(`✅ AI Generation successful on attempt ${attempt}`);
        
        const rawJson = response.text;
        
        if (rawJson) {
          try {
            const result = JSON.parse(rawJson);
            
            // Validate result structure
            if (!result.primary || !result.rasa_variations || !result.contexts) {
              throw new Error("Invalid response structure from AI");
            }
            
            // Ensure all required variations exist
            const requiredKeys = ["0", "1", "2", "3"];
            for (const key of requiredKeys) {
              if (!result.rasa_variations[key] || result.rasa_variations[key].trim().length === 0) {
                throw new Error(`Missing or empty variation for key: ${key}`);
              }
            }
            
            // Validate contexts mapping
            const expectedContexts = { safety: "0", convenience: "1", quality: "2", health: "3" };
            if (!result.contexts || JSON.stringify(result.contexts) !== JSON.stringify(expectedContexts)) {
              console.warn('AI returned invalid contexts, using default mapping');
              result.contexts = expectedContexts;
            }
            
            // Enforce word count limits (max 120 words per description)
            const enforceWordLimit = (text: string): string => {
              const words = text.trim().split(/\s+/);
              return words.length > 120 ? words.slice(0, 120).join(' ') + '...' : text;
            };
            
            result.primary = enforceWordLimit(result.primary);
            Object.keys(result.rasa_variations).forEach(key => {
              result.rasa_variations[key] = enforceWordLimit(result.rasa_variations[key]);
            });
            
            return result;
            
          } catch (parseError) {
            console.error('Failed to parse product description response:', parseError, 'Raw:', rawJson);
            
            // Graceful fallback: generate simple benefit-focused descriptions
            console.log('Using fallback description generation for:', productName);
            return {
              primary: `${productName} - chất lượng cao, giá trị tuyệt vời cho khách hàng`,
              rasa_variations: {
                "0": `${productName} an toàn, đáng tin cậy cho mọi gia đình`,
                "1": `${productName} tiện lợi, dễ sử dụng hàng ngày`, 
                "2": `${productName} chất lượng cao, hiệu quả vượt trội`,
                "3": `${productName} tốt cho sức khỏe, mang lại hạnh phúc`
              },
              contexts: {
                safety: "0",
                convenience: "1", 
                quality: "2",
                health: "3"
              }
            };
          }
        } else {
          throw new Error("Empty response from Gemini API");
        }
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ AI Generation attempt ${attempt} failed:`, error.message);
        
        // Check if it's a 503 overload error that we should retry
        if (error.status === 503 && attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`⏳ API overloaded, retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        
        // For non-retryable errors, break immediately  
        break;
      }
    }
    
    // If we get here, all retries failed - return graceful fallback with telemetry
    console.error(`💥 AI Generation failed after ${maxRetries} attempts for: ${productName}`);
    if (lastError) {
      console.error(`📊 Final error details:`, lastError.message);
    }
    console.log('🔄 Using graceful fallback descriptions due to API failures');
    
    return {
      primary: `${productName} - chất lượng cao, giá trị tuyệt vời cho khách hàng`,
      rasa_variations: {
        "0": `${productName} an toàn, đáng tin cậy cho mọi gia đình`,
        "1": `${productName} tiện lợi, dễ sử dụng hàng ngày`, 
        "2": `${productName} chất lượng cao, hiệu quả vượt trội`,
        "3": `${productName} tốt cho sức khỏe, mang lại hạnh phúc`
      },
      contexts: {
        safety: "0",
        convenience: "1", 
        quality: "2",
        health: "3"
      }
    };
  }
}

// Export singleton instance
export const aiContentGenerator = new AIContentGenerator();