-- Seed data cho Industry Detection System
-- Chạy sau khi đã có schema mới

-- 1. Thêm các ngành hàng chính (nếu chưa có)
INSERT INTO industries (id, name, description, "is_active", "sort_order") VALUES
('fashion-001', 'Thời trang', 'Quần áo, giày dép, phụ kiện thời trang', true, 1),
('electronics-002', 'Điện tử', 'Điện thoại, laptop, thiết bị điện tử', true, 2),
('home-kitchen-003', 'Gia dụng', 'Nội thất, đồ gia dụng, nhà bếp', true, 3),
('food-beverage-004', 'Thực phẩm', 'Đồ ăn, thức uống, thực phẩm chức năng', true, 4),
('beauty-005', 'Mỹ phẩm', 'Sản phẩm làm đẹp, chăm sóc da, trang điểm', true, 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Thêm keywords cho từng ngành
-- THỜI TRANG
INSERT INTO industry_keywords (industry_id, keyword, weight, is_active) VALUES
-- Từ khóa chính
('fashion-001', 'áo', 2.5, true),
('fashion-001', 'quần', 2.5, true),
('fashion-001', 'giày', 2.0, true),
('fashion-001', 'dép', 2.0, true),
('fashion-001', 'váy', 2.5, true),
('fashion-001', 'đầm', 2.5, true),
('fashion-001', 'thời trang', 3.0, true),
-- Chi tiết hơn
('fashion-001', 'áo thun', 2.8, true),
('fashion-001', 'áo sơ mi', 2.8, true),
('fashion-001', 'quần jean', 2.8, true),
('fashion-001', 'sneaker', 2.2, true),
('fashion-001', 'túi xách', 2.5, true),
('fashion-001', 'phụ kiện', 1.8, true),
('fashion-001', 'trang phục', 2.5, true),
('fashion-001', 'size', 1.5, true),
('fashion-001', 'màu sắc', 1.5, true);

-- ĐIỆN TỬ
INSERT INTO industry_keywords (industry_id, keyword, weight, is_active) VALUES
-- Từ khóa chính
('electronics-002', 'điện thoại', 3.0, true),
('electronics-002', 'laptop', 3.0, true),
('electronics-002', 'máy tính', 2.8, true),
('electronics-002', 'tai nghe', 2.5, true),
('electronics-002', 'sạc', 2.0, true),
('electronics-002', 'điện tử', 2.8, true),
-- Chi tiết hơn
('electronics-002', 'iphone', 2.8, true),
('electronics-002', 'samsung', 2.5, true),
('electronics-002', 'macbook', 2.8, true),
('electronics-002', 'airpods', 2.5, true),
('electronics-002', 'camera', 2.5, true),
('electronics-002', 'loa', 2.2, true),
('electronics-002', 'ram', 2.0, true),
('electronics-002', 'cpu', 2.0, true),
('electronics-002', 'cấu hình', 1.8, true);

-- GIA DỤNG
INSERT INTO industry_keywords (industry_id, keyword, weight, is_active) VALUES
-- Từ khóa chính
('home-kitchen-003', 'nồi', 2.8, true),
('home-kitchen-003', 'chảo', 2.8, true),
('home-kitchen-003', 'bàn', 2.5, true),
('home-kitchen-003', 'ghế', 2.5, true),
('home-kitchen-003', 'gia dụng', 3.0, true),
('home-kitchen-003', 'nhà bếp', 2.8, true),
-- Chi tiết hơn
('home-kitchen-003', 'nồi cơm điện', 2.8, true),
('home-kitchen-003', 'máy xay', 2.5, true),
('home-kitchen-003', 'tủ lạnh', 2.8, true),
('home-kitchen-003', 'nội thất', 2.5, true),
('home-kitchen-003', 'chén bát', 2.2, true),
('home-kitchen-003', 'đũa', 2.0, true),
('home-kitchen-003', 'thìa', 2.0, true),
('home-kitchen-003', 'sofa', 2.5, true);

-- THỰC PHẨM
INSERT INTO industry_keywords (industry_id, keyword, weight, is_active) VALUES
-- Từ khóa chính
('food-beverage-004', 'thực phẩm', 3.0, true),
('food-beverage-004', 'đồ ăn', 2.8, true),
('food-beverage-004', 'nước', 2.5, true),
('food-beverage-004', 'bánh', 2.5, true),
('food-beverage-004', 'kẹo', 2.2, true),
('food-beverage-004', 'trà', 2.2, true),
-- Chi tiết hơn
('food-beverage-004', 'bánh mì', 2.5, true),
('food-beverage-004', 'phở', 2.5, true),
('food-beverage-004', 'cơm', 2.5, true),
('food-beverage-004', 'nước ngọt', 2.3, true),
('food-beverage-004', 'trà sữa', 2.5, true),
('food-beverage-004', 'cafe', 2.3, true),
('food-beverage-004', 'vitamin', 2.0, true),
('food-beverage-004', 'dinh dưỡng', 1.8, true);

-- MỸ PHẨM
INSERT INTO industry_keywords (industry_id, keyword, weight, is_active) VALUES
-- Từ khóa chính
('beauty-005', 'mỹ phẩm', 3.0, true),
('beauty-005', 'kem', 2.5, true),
('beauty-005', 'son', 2.8, true),
('beauty-005', 'nước hoa', 2.8, true),
('beauty-005', 'làm đẹp', 2.8, true),
-- Chi tiết hơn
('beauty-005', 'kem dưỡng', 2.5, true),
('beauty-005', 'serum', 2.5, true),
('beauty-005', 'mascara', 2.3, true),
('beauty-005', 'phấn', 2.3, true),
('beauty-005', 'chăm sóc da', 2.5, true),
('beauty-005', 'trang điểm', 2.5, true),
('beauty-005', 'skincare', 2.3, true),
('beauty-005', 'anti-aging', 2.0, true);

-- 3. Thêm response templates cho các intent
-- THỜI TRANG - Templates
INSERT INTO industry_templates (industry_id, intent, template, language, is_active, priority) VALUES
('fashion-001', 'product_search', '👗 **THỜI TRANG** - Tìm kiếm sản phẩm thời trang cho bạn!

Tôi có thể giúp bạn tìm:
🔹 Quần áo nam/nữ 
🔹 Giày dép trendy
🔹 Phụ kiện thời trang
🔹 Trang phục theo dịp

Bạn muốn tìm loại nào? Hoặc có size/màu ưa thích không? 👕👔', 'vi', true, 10),

('fashion-001', 'product_recommendation', '✨ **GỢI Ý THỜI TRANG** dành riêng cho bạn!

Dựa vào xu hướng hiện tại:
🌟 Mix & match dễ dàng
🌟 Chất liệu cao cấp  
🌟 Giá cả hợp lý

Cho tôi biết phong cách yêu thích để tư vấn chính xác nhé! 💫', 'vi', true, 10),

('fashion-001', 'price_inquiry', '💰 **GIÁ CẢ THỜI TRANG** - Minh bạch & Cạnh tranh!

✅ Giá niêm yết rõ ràng
✅ Khuyến mãi thường xuyên  
✅ Chính sách đổi trả linh hoạt

Sản phẩm nào bạn quan tâm? Tôi sẽ báo giá chi tiết! 🏷️', 'vi', true, 10);

-- ĐIỆN TỬ - Templates  
INSERT INTO industry_templates (industry_id, intent, template, language, is_active, priority) VALUES
('electronics-002', 'product_search', '📱 **CÔNG NGHỆ ĐIỆN TỬ** - Tìm kiếm thiết bị thông minh!

Sản phẩm hot:
🔥 Smartphone mới nhất
🔥 Laptop/PC gaming
🔥 Phụ kiện công nghệ
🔥 Thiết bị smart home

Bạn cần thiết bị gì? Cho tôi biết nhu cầu sử dụng nhé! ⚡', 'vi', true, 10),

('electronics-002', 'product_recommendation', '🚀 **GỢI Ý CÔNG NGHỆ** theo nhu cầu!

Tư vấn dựa trên:
⚙️ Cấu hình phù hợp
⚙️ Ngân sách của bạn
⚙️ Mục đích sử dụng

Làm việc, gaming hay giải trí? Tôi sẽ gợi ý thiết bị tối ưu! 🎯', 'vi', true, 10);

-- GIA DỤNG - Templates
INSERT INTO industry_templates (industry_id, intent, template, language, is_active, priority) VALUES
('home-kitchen-003', 'product_search', '🏠 **GIA DỤNG & NỘI THẤT** - Trang bị ngôi nhà yêu thương!

Danh mục đa dạng:
🏡 Nội thất phòng khách
🏡 Đồ dùng nhà bếp
🏡 Phụ kiện trang trí
🏡 Thiết bị gia dụng

Bạn đang tìm đồ cho phòng nào? Tôi sẽ tư vấn phù hợp! 🛋️', 'vi', true, 10),

('home-kitchen-003', 'product_recommendation', '✨ **GỢI Ý NỘI THẤT** - Làm đẹp không gian sống!

Tiêu chí lựa chọn:
🎨 Phong cách thiết kế
🎨 Kích thước phù hợp  
🎨 Chất liệu bền đẹp

Chia sẻ không gian và sở thích để tôi tư vấn tốt nhất! 🏡', 'vi', true, 10);

-- THỰC PHẨM - Templates
INSERT INTO industry_templates (industry_id, intent, template, language, is_active, priority) VALUES
('food-beverage-004', 'product_search', '🍀 **THỰC PHẨM SẠCH** - Dinh dưỡng cho sức khỏe!

Đa dạng lựa chọn:
🥗 Thực phẩm tươi ngon
🥗 Đồ uống healthy
🥗 Thực phẩm chức năng
🥗 Món ăn đặc sản

Bạn đang tìm gì để bổ sung dinh dưỡng? 🌱', 'vi', true, 10),

('food-beverage-004', 'product_recommendation', '🌟 **GỢI Ý DINH DƯỠNG** phù hợp với bạn!

Dựa trên:
💚 Nhu cầu sức khỏe
💚 Khẩu vị cá nhân
💚 Chế độ dinh dưỡng

Chia sẻ mục tiêu sức khỏe để tôi gợi ý món phù hợp! 🥄', 'vi', true, 10);

-- MỸ PHẨM - Templates
INSERT INTO industry_templates (industry_id, intent, template, language, is_active, priority) VALUES
('beauty-005', 'product_search', '💄 **MỸ PHẨM CHÍNH HÃNG** - Làm đẹp tự nhiên!

Sản phẩm chất lượng:
💅 Chăm sóc da mặt
💅 Trang điểm cao cấp
💅 Dưỡng thể toàn diện
💅 Nước hoa quyến rũ

Loại da và nhu cầu làm đẹp của bạn là gì? ✨', 'vi', true, 10),

('beauty-005', 'product_recommendation', '🌺 **TỰ VẤN LÀM ĐẸP** chuyên sâu!

Phân tích:
🔬 Loại da & tình trạng
🔬 Mục tiêu làm đẹp
🔬 Ngân sách phù hợp

Mô tả da và mong muốn để tôi tư vấn routine hoàn hảo! 💎', 'vi', true, 10);

-- 4. Thêm detection rules cho từng ngành
INSERT INTO industry_rules (industry_id, rules_json, is_active) VALUES
('fashion-001', '{
  "minKeywordMatches": 1,
  "confidenceThreshold": 0.6,
  "requiredKeywords": [],
  "excludeKeywords": ["điện tử", "máy tính", "laptop"],
  "contextRules": {
    "sizeKeywords": ["size", "xl", "m", "l", "s"],
    "colorKeywords": ["màu", "đỏ", "xanh", "đen", "trắng"],
    "brandKeywords": ["zara", "h&m", "uniqlo"]
  }
}', true),

('electronics-002', '{
  "minKeywordMatches": 1,
  "confidenceThreshold": 0.7,
  "requiredKeywords": [],
  "excludeKeywords": ["quần áo", "thời trang", "ăn", "thực phẩm"],
  "contextRules": {
    "specKeywords": ["ram", "gb", "inch", "hz", "cpu"],
    "brandKeywords": ["apple", "samsung", "sony", "lg"]
  }
}', true),

('home-kitchen-003', '{
  "minKeywordMatches": 1,
  "confidenceThreshold": 0.65,
  "requiredKeywords": [],
  "excludeKeywords": ["điện thoại", "laptop", "thời trang"],
  "contextRules": {
    "roomKeywords": ["phòng khách", "nhà bếp", "phòng ngủ"],
    "materialKeywords": ["gỗ", "inox", "nhựa", "thủy tinh"]
  }
}', true),

('food-beverage-004', '{
  "minKeywordMatches": 1,
  "confidenceThreshold": 0.7,
  "requiredKeywords": [],
  "excludeKeywords": ["điện tử", "quần áo", "mỹ phẩm"],
  "contextRules": {
    "healthKeywords": ["organic", "sạch", "tươi", "dinh dưỡng"],
    "mealKeywords": ["sáng", "trưa", "chiều", "tối"]
  }
}', true),

('beauty-005', '{
  "minKeywordMatches": 1,
  "confidenceThreshold": 0.65,
  "requiredKeywords": [],
  "excludeKeywords": ["thực phẩm", "điện tử", "gia dụng"],
  "contextRules": {
    "skinKeywords": ["da khô", "da dầu", "da hỗn hợp", "da nhạy cảm"],
    "brandKeywords": ["loreal", "maybelline", "innisfree"]
  }
}', true);