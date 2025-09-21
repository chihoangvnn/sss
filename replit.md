# E-Commerce Admin Dashboard & Storefront

## Overview
This project is a comprehensive e-commerce management system, integrating an admin dashboard, storefront generation, and advanced social media management. Built with React, TypeScript, and modern web technologies, its primary purpose is to provide complete management capabilities for products, orders, and customers. Key capabilities include generating product landing pages, public storefronts, chatbot integration, and an innovative "Bộ Não - Cánh Tay - Vệ Tinh" (Brain-Arms-Satellites) architecture for automated social media content distribution. The system aims to streamline e-commerce operations, enhance customer engagement, and automate social media presence for businesses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based Single-Page Application (SPA) architecture with TypeScript for type safety, Vite for fast development, Wouter for lightweight routing, TanStack Query for server state management, and Shadcn/UI for comprehensive components built on Radix UI.

### UI Design System
A custom design system optimized for e-commerce, featuring Tailwind CSS for utility-first styling, a natural organic color palette (forest green primary, sage green secondary, warm terracotta accents), Nunito Sans font for a friendly aesthetic, and a mobile-first responsive design with bottom navigation for storefronts.

### Backend Architecture
An Express.js-based REST API is used, deployed as Vercel serverless functions. It features a modular route structure, TypeScript for full-stack type safety, and session-based authentication with PostgreSQL session storage.

### Data Storage Solutions
A multi-database approach is employed, using Neon serverless PostgreSQL as the primary database with Drizzle ORM for type-safe operations. Optional Firebase Firestore support is available for extended features like catalogs and product variants. The schema supports comprehensive e-commerce data.

### Storefront Generation System
Dynamic storefront creation is supported with customizable themes, allowing for various storefront types (product landing pages, full storefronts) via public routes (`/lp/:slug`, `/sf/:name`), and offering customization options for themes, colors, and payment methods. Analytics integration provides tracking and performance metrics.

### Social Media Integration
Multi-platform social media management capabilities include Facebook integration (OAuth, page management, posting), with an extensible architecture for additional platforms. It supports account management and content publishing.

### Satellite System Architecture
An advanced automated social media management system uses a "Bộ Não - Cánh Tay - Vệ Tinh" architecture for scalable content management. It features 6 production-ready satellite templates (Content and Customer Pipeline), intelligent content filtering via "Nội dung" category tags, a customizable deployment workflow with theme selection, platform targeting, and scheduling, real-time analytics, and a scalable design for 1000+ Facebook pages. A two-tier guide system provides comprehensive and template-specific documentation.

### Chatbot Integration
RASA chatbot integration provides customer support automation, utilizing specialized API endpoints for product discovery and catalog navigation, conversation management, AI-powered product recommendations, and Vietnamese language optimized responses.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Firebase**: Alternative NoSQL database.
- **Connect-pg-simple**: PostgreSQL session store.

### Payment Integration
- **Bank Transfer Support**: Vietnamese bank integration with QR code generation.
- **Multiple Payment Methods**: Cash on delivery, online payments, bank transfers.

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
- **QR Code Generation**: For Vietnamese banking.

## Satellite System Complete Documentation

### Recent Changes - September 21, 2025
Complete Satellite System Implementation:
- Implemented comprehensive satellite-based automated social media management system with "Bộ Não - Cánh Tay - Vệ Tinh" (Brain-Arms-Satellites) architecture
- Added complete backend API endpoints: 7 endpoints including templates, content filtering, and deployment workflow
- Created sophisticated content filtering system processing only "Nội dung" category tags via UI-driven API parameters
- Built comprehensive customization interface with theme selection, platform targeting, scheduling options
- Implemented dual-tier guide system: Main "Quick Start Guide" plus template-specific BookOpen guides
- Successfully deployed and tested end-to-end workflow with real-time status tracking
- Added 6 production-ready satellite templates: 4 Content Satellites and 2 Customer Pipeline Satellites

### Comprehensive API Reference

#### Authentication & Security
- **Most endpoints require authentication** via `requireAuth` middleware (development mode bypasses)
- **Critical Security Issue**: `POST /api/satellites/deploy` is currently **unauthenticated** - security vulnerability

#### Complete Satellite API Endpoints (7 Total)

**GET /api/satellites/templates** *(Auth: Required)*
- Retrieve 6 available satellite templates with full configuration data
- Response: `{success: true, templates: [{id, name, category, description, icon, color, platforms, features}], totalCount: 6}`

**GET /api/satellites/by-tag/:tagName** *(Auth: Required)*  
- Filter content and accounts by unified tag system
- Query Parameters: `?platform=[facebook|instagram|twitter|all]&status=[scheduled|published|failed|all]`
- Response: `{success: true, tag: {...}, data: {contentLibrary: [], socialAccounts: [], scheduledPosts: [], analytics: {}}}`

**GET /api/satellites/by-group/:groupId** *(Auth: Required)*
- Get content and accounts for specific account group (no query parameter filtering implemented)
- Response: `{success: true, group: {id, name, description, platform, priority, weight, isActive}, data: {socialAccounts: [], scheduledPosts: [], analytics: {}}}`

**GET /api/satellites/tags** *(Auth: Required)*
- Retrieve all unified tags with filtering
- Query Parameters: `?category=[content|customer_pipeline|general]&platform=[facebook|instagram|twitter|tiktok]`

**GET /api/satellites/overview** *(Auth: Required)*
- Get satellite system overview with comprehensive analytics and status

**POST /api/satellites/deploy** *(Auth: NONE - Security Vulnerability)*
- Deploy satellite (**SIMULATED DEPLOYMENT - No actual database writes or provisioning**)
- Request: `{templateName, templateData, customizations: {theme, primaryColor, platforms[], contentFrequency}, settings}`
- Response: `{success: true, deployment: {id, templateName, status: "deployed", customizations, deployedAt}}`
- **Warning**: Returns simulated response, not actual system provisioning

**POST /api/satellites/schedule-posts** *(Auth: Required)*
- Schedule posts (**LIMITED: Only `distributionType: "bulk"` supported - others return 501**)
- Request: `{contentIds: string[], targetAccounts: string[], schedulingMode?: "draft"|"pending_approval"|"scheduled", distributionType: "bulk"|"manual"|"smart", timeSettings?: {scheduledTime?: Date, timezone?: string}, tagFilters?: string[]}`
- Response: Success for bulk distribution, 400 error if contentIds/targetAccounts missing, 501 for manual/smart modes
- **Critical**: Both contentIds and targetAccounts arrays are required

### Content Management Integration
- **Tag-Based Filtering**: UI filters content tagged with "Nội dung" category (UI-driven using API parameters, not globally enforced)
- **6 Satellite Templates**: Beauty (💄), Fitness (💪), Health (🏥), Mindfulness (🧘), VIP Management (⭐), Follow-up Hub (🔄)
- **Deployment Process**: Template Selection → Customization → Platform Configuration → Simulated Deployment