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
}

// Export singleton instance
export const aiContentGenerator = new AIContentGenerator();