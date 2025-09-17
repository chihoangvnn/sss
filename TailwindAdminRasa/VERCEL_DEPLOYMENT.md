# Hướng dẫn Deploy lên Vercel

## Các file cần thiết đã tạo:
✅ `vercel.json` - Cấu hình deployment cho Vercel
✅ `.vercelignore` - Loại trừ file không cần thiết
✅ `.env.example` - Template cho environment variables

## Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

## Bước 2: Tạo project trên Vercel
1. Vào [vercel.com](https://vercel.com)
2. Connect với GitHub account
3. Import repository của bạn
4. Chọn framework: **Other**

## Bước 3: Cấu hình Environment Variables
Trong Vercel dashboard, vào **Settings** > **Environment Variables** và thêm:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-random-secret-key
NODE_ENV=production
```

### PostgreSQL Database Options:
- **Neon** (miễn phí): https://neon.tech
- **Supabase** (miễn phí): https://supabase.com
- **Railway** (có phí): https://railway.app

## Bước 4: Build Settings
Vercel sẽ tự động detect, nhưng nếu cần:
- **Build Command**: `npm run build` 
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Bước 5: Deploy
1. Click **Deploy**
2. Đợi build hoàn thành
3. Test các API endpoints

## Troubleshooting
- Nếu lỗi build: Check logs và đảm bảo tất cả dependencies đã có
- Nếu lỗi runtime: Kiểm tra environment variables
- Nếu lỗi database: Đảm bảo DATABASE_URL đúng và accessible từ internet

## ✅ API Endpoints sau khi deploy:
### Core APIs:
- `/api/health` - Health check
- `/api/products` - Quản lý sản phẩm (GET, POST)
- `/api/customers` - Quản lý khách hàng (GET, POST)  
- `/api/orders` - Quản lý đơn hàng (GET, POST)

### RASA Chatbot APIs:
- `/api/rasa/catalogs` - Danh sách danh mục
- `/api/rasa/products?q=search` - Tìm kiếm sản phẩm

## 📁 Cấu trúc file đã tạo:
```
api/
├── health.ts           → /api/health
├── products.ts         → /api/products  
├── customers.ts        → /api/customers
├── orders.ts           → /api/orders
└── rasa/
    ├── catalogs.ts     → /api/rasa/catalogs
    └── products.ts     → /api/rasa/products
```

## Test APIs sau khi deploy:
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Products
curl https://your-app.vercel.app/api/products

# RASA search
curl "https://your-app.vercel.app/api/rasa/products?q=iphone"
```