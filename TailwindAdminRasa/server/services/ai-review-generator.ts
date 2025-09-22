import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with fail-fast for missing API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error('FATAL: GEMINI_API_KEY environment variable is required but not provided');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Production-ready Gemini configuration - no model initialization needed

// Enhanced error types for better debugging
interface AIGenerationError {
  type: 'API_ERROR' | 'PARSING_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'AUTHENTICATION' | 'UNKNOWN';
  message: string;
  originalError?: any;
  retryable: boolean;
}

export interface ReviewSeedingRequest {
  productId: string;
  quantity: number;
  ratingDistribution?: {
    star5: number; // percentage
    star4: number; // percentage
    star3: number; // percentage
    star2: number; // percentage
    star1: number; // percentage
  };
  includeImages?: boolean;
  customPrompt?: string;
}

export interface GeneratedReview {
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  content: string;
  isVerified: boolean;
  helpfulCount: number;
}

export interface ReviewSeedingResponse {
  success: boolean;
  generated: number;
  reviews: GeneratedReview[];
  productId: string;
  message: string;
  metadata?: {
    summary: {
      requested: number;
      generated: number;
      aiGenerated: number;
      fallbackCount: number;
      errorCount: number;
      successRate: string;
      status: string;
    };
    hasErrors: boolean;
    isPartialSuccess: boolean;
  };
}

export class AIReviewGenerator {
  private vietnameseNames = [
    "Nguyễn Thị Hương", "Trần Văn Nam", "Lê Thị Mai", "Phạm Minh Tuấn", "Hoàng Thị Lan",
    "Võ Văn Đức", "Đặng Thị Ngọc", "Bùi Minh Khoa", "Đỗ Thị Hồng", "Ngô Văn Hùng",
    "Lý Thị Thảo", "Vũ Minh Châu", "Đinh Thị Linh", "Chu Văn Sơn", "Mai Thị Yến",
    "Tạ Minh Đức", "Dương Thị Tú", "Lưu Văn Thắng", "Phan Thị Nhung", "Tô Minh Phúc",
    "Cao Thị Bích", "Lâm Văn Hoàng", "Đào Thị Thu", "Trịnh Minh Tâm", "Hồ Thị Liên",
    "Từ Văn Quang", "Kiều Thị Oanh", "Thái Minh Đại", "Ôn Thị Hạnh", "La Văn Khôi",
    "Âu Thị Mỹ", "Quan Minh Hải", "Ưng Thị Phượng", "Ích Văn Long", "Ỷ Thị Xuân"
  ];

  private getRandomName(): string {
    return this.vietnameseNames[Math.floor(Math.random() * this.vietnameseNames.length)];
  }

  private generateRatingDistribution(quantity: number, distribution?: ReviewSeedingRequest['ratingDistribution']): number[] {
    const defaultDistribution = {
      star5: 45, // 45% are 5-star
      star4: 35, // 35% are 4-star
      star3: 15, // 15% are 3-star
      star2: 4,  // 4% are 2-star
      star1: 1   // 1% are 1-star
    };

    const dist = distribution || defaultDistribution;
    const ratings: number[] = [];

    // Generate ratings based on distribution
    const star5Count = Math.round((quantity * dist.star5) / 100);
    const star4Count = Math.round((quantity * dist.star4) / 100);
    const star3Count = Math.round((quantity * dist.star3) / 100);
    const star2Count = Math.round((quantity * dist.star2) / 100);
    const star1Count = quantity - star5Count - star4Count - star3Count - star2Count;

    // Add ratings to array
    for (let i = 0; i < star5Count; i++) ratings.push(5);
    for (let i = 0; i < star4Count; i++) ratings.push(4);
    for (let i = 0; i < star3Count; i++) ratings.push(3);
    for (let i = 0; i < star2Count; i++) ratings.push(2);
    for (let i = 0; i < star1Count; i++) ratings.push(1);

    // Shuffle the ratings to randomize order
    return ratings.sort(() => Math.random() - 0.5);
  }

  private async generateSingleReview(
    productName: string,
    productDescription: string,
    targetRating: number,
    customPrompt?: string,
    retryCount: number = 0
  ): Promise<GeneratedReview> {
    const maxRetries = 2;
    
    // 🎯 SINGLE SMART PROMPT - Mixed Natural Reviews
    const smartPrompt = `Bạn là chuyên gia tạo đánh giá sản phẩm thực tế cho thị trường Việt Nam.

🎯 NHIỆM VỤ: Tạo đánh giá tự nhiên, ĐA DẠNG style như người thật:

📊 PHÂN BỐ STYLE (tự động vary):
• 70% Reviews ngắn gọn, bình thường: "Sản phẩm tốt", "Giao hàng nhanh", "Ổn"  
• 20% Reviews có context: Đề cập 1-2 feature cụ thể một cách casual
• 10% Reviews cực ngắn: "Tốt", "Ok", "👍", "Ổn áp"

🗣️ TONE NGƯIỜI VIỆT:
- Ngôn ngữ đời thường, không formal
- Mix từ "ổn", "tạm", "khá", "tốt", "ok" 
- Thỉnh thoảng typo nhẹ như người thật
- Emoji đôi khi (👍, 😊, ❤️)

⭐ THEO RATING:
- 5 sao: Positive nhưng không over-praise
- 4 sao: Hài lòng, đôi khi mention điểm cần cải thiện  
- 3 sao: Neutral, "tạm được", "bình thường"
- 1-2 sao: Thất vọng nhưng không extreme

🎨 OUTPUT MIX: Mỗi lần generate tự động tạo ra các style khác nhau, natural và believable.

THÔNG TIN SẢN PHẨM:
- Tên: ${productName}
- Mô tả: ${productDescription}
- Target Rating: ${targetRating}/5 sao

${customPrompt ? `GHI CHÚ: ${customPrompt}\n` : ''}>> Tự động vary style theo phân bỐ đã nêu, tạo review natural như người Việt thật <<`;

    try {
      // Use production-grade API structure with schema enforcement
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `${smartPrompt}\n\n>> Tạo 1 review ${targetRating} sao theo smart prompt trên <<`
          }]
        }],
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              customerName: { 
                type: "string",
                description: "Tên khách hàng Việt Nam tự nhiên"
              },
              rating: { 
                type: "number",
                description: "Số sao đánh giá (1-5)"
              },
              title: { 
                type: "string",
                description: "Tiêu đề ngắn gọn cho đánh giá (5-15 từ)"
              },
              content: { 
                type: "string",
                description: "Nội dung đánh giá chi tiết bằng tiếng Việt"
              },
              isVerified: { 
                type: "boolean",
                description: "Trạng thái xác minh khách hàng"
              },
              helpfulCount: { 
                type: "number",
                description: "Số lượt đánh giá hữu ích (0-15)"
              }
            },
            required: ["customerName", "rating", "title", "content", "isVerified", "helpfulCount"]
          }
        }
      });

      // Proper response parsing with error handling
      if (!response || !response.candidates || response.candidates.length === 0) {
        throw this.createError('API_ERROR', 'No candidates returned from Gemini API', null, true);
      }

      const candidate = response.candidates[0];
      
      // Check for safety or other finish reasons
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.warn(`⚠️ Generation finished with reason: ${candidate.finishReason}`);
        if (candidate.finishReason === 'SAFETY') {
          throw this.createError('VALIDATION_ERROR', 'Content blocked by safety filters', candidate.finishReason, false);
        }
      }

      // Extract text content
      const textPart = candidate.content?.parts?.find((part: any) => part.text);
      if (!textPart || !textPart.text) {
        throw this.createError('API_ERROR', 'No text content in response', candidate, true);
      }

      const rawJson = textPart.text.trim();
      console.log(`🤖 Generated review JSON (${rawJson.length} chars):`, rawJson.substring(0, 200) + '...');
      
      // Enhanced JSON parsing with better error handling
      let review;
      try {
        // Clean potential markdown formatting
        const cleanJson = rawJson.replace(/```json\n?|```\n?/g, '').trim();
        review = JSON.parse(cleanJson);
      } catch (parseError: any) {
        console.error('📝 Raw response that failed to parse:', rawJson);
        throw this.createError('PARSING_ERROR', `Invalid JSON format: ${parseError?.message || 'Unknown parse error'}`, parseError, false);
      }

      // Comprehensive validation and enhancement
      const validatedReview = this.validateAndEnhanceReview(review, targetRating);
      
      console.log(`✅ Successfully generated review for "${productName}" (${targetRating} stars)`);
      return validatedReview;
      
    } catch (error) {
      const aiError = this.categorizeError(error);
      console.error(`❌ Review generation failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        type: aiError.type,
        message: aiError.message,
        retryable: aiError.retryable
      });

      // Enhanced retry logic with adaptive backoff
      if (aiError.retryable && retryCount < maxRetries) {
        // Extract retry-after from 429 responses if available
        const retryAfter = aiError.originalError?.headers?.['retry-after'];
        const baseDelay = (retryCount + 1) * 1000; // Exponential base
        const jitter = Math.random() * 500; // Add jitter to prevent thundering herd
        const adaptiveDelay = retryAfter ? Math.max(parseInt(retryAfter) * 1000, baseDelay) : baseDelay;
        const finalDelay = adaptiveDelay + jitter;
        
        console.log(`🔄 Retrying review generation (${retryCount + 1}/${maxRetries}) after ${Math.round(finalDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, finalDelay));
        return this.generateSingleReview(productName, productDescription, targetRating, customPrompt, retryCount + 1);
      }

      // If all retries exhausted or non-retryable error, throw the categorized error
      throw aiError;
    }
  }

  /**
   * Validate and enhance generated review data
   */
  private validateAndEnhanceReview(review: any, targetRating: number): GeneratedReview {
    // Validate required fields
    if (!review || typeof review !== 'object') {
      throw this.createError('VALIDATION_ERROR', 'Review is not a valid object', review, false);
    }

    const errors = [];
    if (!review.customerName || typeof review.customerName !== 'string') errors.push('customerName');
    if (!review.title || typeof review.title !== 'string') errors.push('title');
    if (!review.content || typeof review.content !== 'string') errors.push('content');
    
    if (errors.length > 0) {
      throw this.createError('VALIDATION_ERROR', `Missing or invalid fields: ${errors.join(', ')}`, review, false);
    }

    // Enhanced review object with fallbacks and validation
    return {
      customerName: review.customerName || this.getRandomName(),
      rating: targetRating, // Always use target rating to ensure accuracy
      title: this.sanitizeText(review.title, 'Đánh giá sản phẩm', 100),
      content: this.sanitizeText(review.content, 'Sản phẩm ổn, đáng giá tiền.', 1000),
      isVerified: typeof review.isVerified === 'boolean' ? review.isVerified : Math.random() > 0.3,
      helpfulCount: Math.max(0, Math.min(15, 
        typeof review.helpfulCount === 'number' && !isNaN(review.helpfulCount) 
          ? Math.floor(review.helpfulCount) 
          : Math.floor(Math.random() * 16)
      ))
    };
  }

  /**
   * Sanitize and validate text fields
   */
  private sanitizeText(text: string, fallback: string, maxLength: number): string {
    if (!text || typeof text !== 'string') return fallback;
    
    const cleaned = text.trim();
    if (cleaned.length === 0) return fallback;
    if (cleaned.length > maxLength) return cleaned.substring(0, maxLength).trim() + '...';
    
    return cleaned;
  }

  /**
   * Create categorized error with metadata
   */
  private createError(type: AIGenerationError['type'], message: string, originalError?: any, retryable: boolean = false): AIGenerationError {
    return {
      type,
      message,
      originalError,
      retryable
    };
  }

  /**
   * Categorize errors for better handling
   */
  private categorizeError(error: any): AIGenerationError {
    if (error.type && error.message) {
      return error; // Already categorized
    }

    // API-specific error handling
    if (error.status === 503 || error.message?.includes('overloaded')) {
      return this.createError('RATE_LIMIT', 'Gemini API is temporarily overloaded', error, true);
    }
    
    if (error.status === 401 || error.message?.includes('API key')) {
      return this.createError('AUTHENTICATION', 'Invalid or missing Gemini API key', error, false);
    }
    
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return this.createError('RATE_LIMIT', 'Rate limit exceeded', error, true);
    }

    if (error.status >= 500) {
      return this.createError('API_ERROR', 'Gemini API server error', error, true);
    }

    if (error.status >= 400 && error.status < 500) {
      return this.createError('VALIDATION_ERROR', 'Request validation failed', error, false);
    }

    // Parsing errors
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      return this.createError('PARSING_ERROR', 'Failed to parse AI response', error, false);
    }

    // Default to unknown error
    return this.createError('UNKNOWN', error.message || 'Unknown error occurred', error, false);
  }

  async generateReviews(request: ReviewSeedingRequest, product: any): Promise<ReviewSeedingResponse> {
    const { productId, quantity, ratingDistribution, customPrompt } = request;

    if (!product) {
      throw new Error('Product not found');
    }

    if (quantity < 1 || quantity > 50) {
      throw new Error('Quantity must be between 1 and 50 reviews');
    }

    // Generate rating distribution
    const ratings = this.generateRatingDistribution(quantity, ratingDistribution);
    
    // Generate reviews in parallel with rate limiting
    const batchSize = 5; // Process 5 reviews at a time to avoid rate limits
    const reviews: GeneratedReview[] = [];
    
    for (let i = 0; i < ratings.length; i += batchSize) {
      const batch = ratings.slice(i, i + batchSize);
      const batchPromises = batch.map(rating => 
        this.generateSingleReview(
          product.name,
          product.description || product.shortDescription || '',
          rating,
          customPrompt
        )
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            reviews.push(result.value);
          } else {
            const error = result.reason;
            const reviewIndex = i + index + 1;
            
            console.error(`❌ Review generation ${reviewIndex} failed:`, {
              error: error.message || error,
              type: error.type || 'UNKNOWN',
              retryable: error.retryable || false
            });
            
            // Production-grade partial failure handling - continue processing
            console.warn(`⚠️ Review ${reviewIndex} failed with ${error.type}: ${error.message}`);
            
            // Use fallback for retryable errors, track critical errors
            if (error.type === 'RATE_LIMIT' || error.type === 'API_ERROR') {
              reviews.push(this.createFallbackReview(batch[index], `[${error.type}]`));
            } else {
              // For critical errors, create structured error report but continue
              reviews.push(this.createFallbackReview(batch[index], `[ERROR: ${error.type}]`));
              
              // Track critical errors for monitoring (but don't abort)
              console.error(`🚨 Critical error tracked for review ${reviewIndex}:`, {
                type: error.type,
                message: error.message,
                product: product.name,
                targetRating: batch[index]
              });
            }
          }
        });

        // Add jittered delay between batches for better rate limit resilience
        if (i + batchSize < ratings.length) {
          const baseDelay = 1000;
          const jitter = Math.random() * 500; // 0-500ms jitter
          await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        }
      } catch (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        throw new Error(`Failed to generate review batch: ${error}`);
      }
    }

    // Production-grade response with detailed error reporting
    const totalGenerated = reviews.length;
    const aiGenerated = reviews.filter(r => !r.title.includes('[Fallback]') && !r.title.includes('[ERROR:')).length;
    const fallbackCount = reviews.filter(r => r.title.includes('[Fallback]') && !r.title.includes('[ERROR:')).length;
    const errorCount = reviews.filter(r => r.title.includes('[ERROR:')).length;
    const successRate = Math.round((aiGenerated / quantity) * 100);

    const summary = {
      requested: quantity,
      generated: totalGenerated,
      aiGenerated,
      fallbackCount,
      errorCount,
      successRate: `${successRate}%`,
      status: successRate >= 80 ? 'excellent' : successRate >= 60 ? 'good' : successRate >= 40 ? 'degraded' : 'poor'
    };

    console.log(`📊 Review Generation Summary:`, summary);

    return {
      success: totalGenerated > 0, // Partial success is still success
      generated: totalGenerated,
      reviews,
      productId,
      message: `Generated ${totalGenerated}/${quantity} Vietnamese reviews: ${aiGenerated} AI-generated, ${fallbackCount} fallback, ${errorCount} errors (${successRate}% success rate)`,
      metadata: {
        summary,
        hasErrors: errorCount > 0,
        isPartialSuccess: totalGenerated < quantity
      }
    };
  }

  /**
   * Create a fallback review when AI generation fails
   */
  private createFallbackReview(rating: number, errorTag: string = '[Fallback]'): GeneratedReview {
    const templates = {
      5: {
        titles: ['Sản phẩm tuyệt vời [Fallback]', 'Rất hài lòng [Fallback]', 'Chất lượng tốt [Fallback]'],
        contents: [
          'Sản phẩm chất lượng tốt, đáng tiền. Sẽ mua lại lần sau.',
          'Rất hài lòng với sản phẩm này. Giao hàng nhanh, đóng gói cẩn thận.',
          'Chất lượng vượt mong đợi. Giá cả hợp lý, sẽ giới thiệu cho bạn bè.'
        ]
      },
      4: {
        titles: ['Sản phẩm tốt [Fallback]', 'Khá hài lòng [Fallback]', 'Đáng mua [Fallback]'],
        contents: [
          'Sản phẩm tốt, chỉ có một vài điểm nhỏ cần cải thiện.',
          'Nhìn chung khá hài lòng. Chất lượng ổn, giao hàng đúng hẹn.',
          'Đáng mua, phù hợp với giá tiền. Có thể cân nhắc mua lại.'
        ]
      },
      3: {
        titles: ['Sản phẩm ổn [Fallback]', 'Bình thường [Fallback]', 'Có thể dùng được [Fallback]'],
        contents: [
          'Sản phẩm bình thường, có thể sử dụng được.',
          'Chất lượng trung bình, giá cả hợp lý.',
          'Ổn, không có gì đặc biệt nhưng cũng không tệ.'
        ]
      },
      2: {
        titles: ['Chưa hài lòng [Fallback]', 'Có vấn đề [Fallback]', 'Cần cải thiện [Fallback]'],
        contents: [
          'Sản phẩm có một số vấn đề, chưa đáp ứng mong đợi.',
          'Chất lượng chưa tốt, cần cải thiện nhiều.',
          'Không như mô tả, khá thất vọng với sản phẩm này.'
        ]
      },
      1: {
        titles: ['Rất thất vọng [Fallback]', 'Không khuyến khích [Fallback]', 'Chất lượng kém [Fallback]'],
        contents: [
          'Rất thất vọng với sản phẩm này. Chất lượng kém, không đáng tiền.',
          'Không khuyến khích mọi người mua. Nhiều vấn đề cần khắc phục.',
          'Chất lượng quá kém, hoàn toàn không đáp ứng mong đợi.'
        ]
      }
    };

    const template = templates[rating as keyof typeof templates] || templates[3];
    const randomTitle = template.titles[Math.floor(Math.random() * template.titles.length)];
    const randomContent = template.contents[Math.floor(Math.random() * template.contents.length)];

    return {
      customerName: this.getRandomName(),
      rating,
      title: randomTitle.replace('[Fallback]', errorTag),
      content: randomContent,
      isVerified: Math.random() > 0.3,
      helpfulCount: Math.floor(Math.random() * 16)
    };
  }
}

// Export singleton instance
export const aiReviewGenerator = new AIReviewGenerator();