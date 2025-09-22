import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    customPrompt?: string
  ): Promise<GeneratedReview> {
    const systemPrompt = `Bạn là một chuyên gia tạo đánh giá sản phẩm thực tế cho thị trường Việt Nam.

NHIỆM VỤ:
Tạo một đánh giá sản phẩm chân thực, tự nhiên bằng tiếng Việt cho sản phẩm được cung cấp.

THÔNG TIN SẢN PHẨM:
- Tên: ${productName}
- Mô tả: ${productDescription}
- Điểm đánh giá mục tiêu: ${targetRating}/5 sao

YÊU CẦU ĐẶC BIỆT:
1. **Ngôn ngữ Việt Nam**: Sử dụng tiếng Việt tự nhiên, phù hợp văn hóa Việt
2. **Tính chân thực**: Đánh giá phải nghe như từ khách hàng thật, không quá hoàn hảo
3. **Phù hợp rating**: 
   - 5 sao: Rất hài lòng, nhiều lời khen
   - 4 sao: Hài lòng, có một vài điểm nhỏ cần cải thiện
   - 3 sao: Ổn, có ưu nhược điểm rõ ràng
   - 2 sao: Không hài lòng, nhiều vấn đề
   - 1 sao: Rất thất vọng, nhiều khiếu nại
4. **Độ dài phù hợp**: 50-300 từ tùy theo rating (rating cao = dài hơn)
5. **Chi tiết thực tế**: Đề cập đến trải nghiệm sử dụng cụ thể

${customPrompt ? `\nGHI CHÚ THÊM: ${customPrompt}` : ''}

Trả về JSON với format chính xác:
{
  "customerName": "tên khách hàng Việt Nam tự nhiên",
  "rating": ${targetRating},
  "title": "tiêu đề ngắn gọn cho đánh giá (5-10 từ)",
  "content": "nội dung đánh giá chi tiết bằng tiếng Việt",
  "isVerified": boolean (70% true, 30% false),
  "helpfulCount": số ngẫu nhiên từ 0-15
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
              customerName: { type: "string" },
              rating: { type: "number" },
              title: { type: "string" },
              content: { type: "string" },
              isVerified: { type: "boolean" },
              helpfulCount: { type: "number" }
            },
            required: ["customerName", "rating", "title", "content", "isVerified", "helpfulCount"]
          }
        },
        contents: `Tạo đánh giá ${targetRating} sao cho sản phẩm: ${productName}\n\nMô tả sản phẩm: ${productDescription}`
      });

      const rawJson = response.text;
      
      if (rawJson) {
        try {
          const review = JSON.parse(rawJson);
          
          // Validate and enhance the generated review
          return {
            customerName: review.customerName || this.getRandomName(),
            rating: targetRating, // Ensure rating matches target
            title: review.title || `Đánh giá sản phẩm`,
            content: review.content || `Sản phẩm ổn, đáng giá tiền.`,
            isVerified: review.isVerified !== undefined ? review.isVerified : Math.random() > 0.3,
            helpfulCount: Math.max(0, Math.min(15, review.helpfulCount || Math.floor(Math.random() * 16)))
          };
        } catch (parseError) {
          console.error('Failed to parse AI review response:', parseError);
          throw new Error('Invalid AI response format');
        }
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (error) {
      console.error('Failed to generate review:', error);
      throw new Error(`AI review generation failed: ${error}`);
    }
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
            console.error(`Review generation ${i + index + 1} failed:`, result.reason);
            // Add fallback review for failed generations
            reviews.push({
              customerName: this.getRandomName(),
              rating: batch[index],
              title: batch[index] >= 4 ? 'Sản phẩm tốt' : batch[index] >= 3 ? 'Sản phẩm ổn' : 'Cần cải thiện',
              content: batch[index] >= 4 ? 
                'Sản phẩm chất lượng tốt, đáng tiền. Sẽ mua lại lần sau.' :
                batch[index] >= 3 ?
                'Sản phẩm bình thường, có thể sử dụng được.' :
                'Sản phẩm chưa đáp ứng mong đợi, cần cải thiện chất lượng.',
              isVerified: Math.random() > 0.3,
              helpfulCount: Math.floor(Math.random() * 16)
            });
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < ratings.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        throw new Error(`Failed to generate review batch: ${error}`);
      }
    }

    return {
      success: true,
      generated: reviews.length,
      reviews,
      productId,
      message: `Successfully generated ${reviews.length} realistic Vietnamese product reviews`
    };
  }
}

// Export singleton instance
export const aiReviewGenerator = new AIReviewGenerator();