import { db } from '../db';
import { industries, categories, products } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Tạo SKU tự động theo format: 2 chữ đầu ngành hàng + 4 số random
 * VD: "DI1234" (Điện tử), "TH5678" (Thời trang)
 */
export async function generateSKU(categoryId: string): Promise<string> {
  try {
    // Lấy thông tin ngành hàng từ categoryId
    const categoryWithIndustry = await db
      .select({
        industryName: industries.name,
      })
      .from(categories)
      .innerJoin(industries, eq(categories.industryId, industries.id))
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!categoryWithIndustry.length) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    const industryName = categoryWithIndustry[0].industryName;
    
    // Lấy 2 chữ cái đầu của tên ngành hàng (uppercase)
    const industryPrefix = extractIndustryPrefix(industryName);
    
    // Tạo SKU unique
    let sku: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Tạo 4 số random
      const randomNumber = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      sku = `${industryPrefix}${randomNumber}`;
      
      // Check xem SKU đã tồn tại chưa
      const existingSku = await db
        .select({ sku: products.sku })
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1);

      if (!existingSku.length) {
        break; // SKU unique, break loop
      }
      
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error(`Unable to generate unique SKU after ${maxAttempts} attempts for industry: ${industryName}`);
    }

    return sku;
  } catch (error) {
    console.error('Error generating SKU:', error);
    throw error;
  }
}

/**
 * Trích xuất 2 chữ cái đầu từ tên ngành hàng
 * Xử lý tiếng Việt có dấu và các trường hợp đặc biệt
 */
function extractIndustryPrefix(industryName: string): string {
  // Remove dấu tiếng Việt và convert thành chữ hoa
  const normalized = industryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // Chỉ giữ chữ và số

  if (normalized.length < 2) {
    // Nếu tên ngành quá ngắn, thêm 'X' để đủ 2 ký tự
    return (normalized + "XX").substring(0, 2);
  }

  return normalized.substring(0, 2);
}

/**
 * Validate SKU format (optional - để check khi cần)
 */
export function isValidSKU(sku: string): boolean {
  // Format: 2 chữ cái + 4 số
  const skuRegex = /^[A-Z]{2}\d{4}$/;
  return skuRegex.test(sku);
}