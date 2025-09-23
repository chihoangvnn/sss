# E-Commerce Admin Dashboard & Storefront

## Overview
This project is a comprehensive e-commerce management system, integrating an admin dashboard, storefront generation, and advanced social media management. Its primary purpose is to provide complete management capabilities for products, orders, and customers, streamline e-commerce operations, enhance customer engagement, and automate social media presence for businesses. Key capabilities include generating product landing pages, public storefronts, chatbot integration, and an innovative "Bộ Não - Cánh Tay - Vệ Tinh" (Brain-Arms-Satellites) architecture for automated social media content distribution. The system emphasizes practical retail functionality with professional Vietnamese business compliance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application utilizes a React-based Single-Page Application (SPA) with TypeScript, Vite, Wouter for routing, TanStack Query for server state, and Shadcn/UI for components. The UI features a custom design system with Tailwind CSS, a natural organic color palette, Nunito Sans font, and mobile-first responsive design.

### Backend Architecture
An Express.js-based REST API, deployed as Vercel serverless functions, uses TypeScript and session-based authentication with PostgreSQL session storage.

### Data Storage Solutions
A multi-database approach includes Neon serverless PostgreSQL with Drizzle ORM, and optional Firebase Firestore for extended features.

### Storefront Generation System
Dynamic storefronts offer customizable themes, supporting product landing pages and full storefronts via public routes (`/lp/:slug`, `/sf/:name`), with integrated analytics.

### Social Media Integration
Multi-platform social media management, including Facebook integration (OAuth, page management, posting), with an extensible architecture.

### Satellite System Architecture
An advanced automated social media management system uses a "Bộ Não - Cánh Tay - Vệ Tinh" architecture for scalable content management. It features 6 production-ready satellite templates, intelligent content filtering, a customizable deployment workflow, real-time analytics, and a scalable design for 1000+ Facebook pages.

### Chatbot Integration
RASA chatbot integration provides customer support automation, product recommendations, and Vietnamese language optimization.

### POS Enhancement System
This system offers a comprehensive set of features for a Vietnamese retail POS, focusing on "functionality over fancy design." Key features include:
- **Professional Keyboard Shortcuts**: For rapid product and customer lookup, and tab switching.
- **Barcode Scanner Integration**: Camera-based scanning for automatic product addition.
- **Customer Quick Loading**: Prioritization of VIP and recent customers.
- **Decimal Quantity Support**: For weight-based products with 0.001 precision and Vietnamese formatting.
- **Multiple Order Tabs System**: Handles up to 5 simultaneous orders with state persistence.
- **KPOS ZY307 Receipt Printing**: Supports Vietnamese UTF-8 encoding, dynamic paper sizes (58mm, 80mm), and Web Serial API direct printing.
- **Product Category Filtering**: UI-driven category filtering with per-tab persistence.
- **Performance Optimization**: Real-time monitoring, diacritic-insensitive Vietnamese search, and intelligent prefetching.

The technical architecture for the POS system includes debounced search, virtualized lists, optimized state management, and comprehensive UTF-8 support for Vietnamese text, currency, and receipt standards. Hardware integration includes KPOS ZY307 thermal printers and barcode scanners.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Firebase**: Alternative NoSQL database.
- **Connect-pg-simple**: PostgreSQL session store.

### Payment Integration
- **Bank Transfer Support**: Vietnamese bank integration with QR code generation.

### Social Media APIs
- **Facebook Graph API**: Page management, posting, analytics.
- **Instagram Basic Display API**: Account connection and metrics.
- **Twitter API**: Account management and posting.

### Development & Deployment
- **Vercel**: Serverless deployment.
- **Vite**: Development server and build optimization.
- **TypeScript**: Compile-time type checking.

### UI & Component Libraries
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon library.
- **Recharts**: Data visualization.
- **React Hook Form**: Form state management.

### Third-party Services
- **Google Fonts**: Typography loading.
- **RASA Framework**: Open-source chatbot framework.
- **ZXing library**: For barcode scanning.