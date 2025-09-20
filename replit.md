# E-Commerce Admin Dashboard & Storefront

## Overview

This is a comprehensive e-commerce management system with admin dashboard, storefront generation, and social media integration built with React, TypeScript, and modern web technologies. The system provides complete management capabilities for products, orders, customers, and includes specialized features for generating product landing pages, public storefronts, chatbot integration with RASA, and social media management.

## Recent Changes

**September 20, 2025** - Post Scheduler UI Enhancement:
- Converted Post Scheduler page to compact one-line layout for better space efficiency
- Removed ScheduledPostsMiniManager component from sidebar (redundant functionality)
- Cleaned up demo data and unused component files
- Improved UI/UX with hover-based action buttons and condensed information display

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based single-page application (SPA) architecture:

- **React with TypeScript**: Full type safety across the application with shared schema validation
- **Vite**: Fast development server and optimized production builds with custom path aliases
- **Wouter**: Lightweight client-side routing for minimal bundle size
- **TanStack Query**: Server state management with automatic caching and background updates
- **Shadcn/UI Components**: Comprehensive component library built on Radix UI primitives

### UI Design System
Custom design system optimized for e-commerce admin and storefront use:

- **Tailwind CSS**: Utility-first styling with extensive custom color palette and spacing system
- **Color System**: Natural organic theme with green-based palette (forest green primary, sage green secondary, warm terracotta accents)
- **Typography**: Nunito Sans font stack for friendly, organic feeling
- **Responsive Design**: Mobile-first approach with bottom navigation for mobile storefronts

### Backend Architecture
Express.js-based REST API with Vercel serverless function deployment:

- **Express.js Framework**: Modular route structure with middleware pattern for logging and error handling
- **TypeScript**: Full-stack type safety with shared schema definitions
- **Session-based Authentication**: PostgreSQL session storage with configurable security settings
- **API Structure**: RESTful endpoints organized by business domains (products, orders, customers, categories)

### Data Storage Solutions
Multi-database architecture supporting both PostgreSQL and Firebase:

- **Primary Database**: PostgreSQL with Neon serverless provider for main application data
- **Drizzle ORM**: Type-safe database operations with compile-time query validation
- **Firebase Integration**: Optional Firebase Firestore support for extended features (catalogs, sub-catalogs, product variants)
- **Schema Design**: Comprehensive e-commerce data model with categories, products, customers, orders, payments, and social accounts

### Storefront Generation System
Dynamic storefront creation with customizable themes:

- **Multiple Storefront Types**: Product landing pages and full storefronts with custom branding
- **Public Routes**: Dedicated public routes (/lp/:slug, /sf/:name) for customer-facing pages
- **Customization Options**: Theme selection, color customization, contact information, payment methods
- **Analytics Integration**: View tracking, conversion rates, and performance metrics

### Social Media Integration
Multi-platform social media management capabilities:

- **Facebook Integration**: OAuth authentication with page management and posting capabilities
- **Platform Support**: Facebook, Instagram, Twitter with extensible architecture for additional platforms
- **Account Management**: Connection status, follower tracking, engagement metrics
- **Content Publishing**: Planned integration for cross-platform content distribution

### Chatbot Integration
RASA chatbot integration for customer support automation:

- **RASA API Endpoints**: Specialized routes for chatbot product discovery and catalog navigation
- **Conversation Management**: Database-backed conversation tracking and history
- **Product Recommendations**: AI-powered product suggestions based on customer queries
- **Multi-language Support**: Vietnamese language optimized responses

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Firebase**: Alternative NoSQL database option with real-time capabilities
- **Connect-pg-simple**: PostgreSQL session store for user authentication

### Payment Integration
- **Bank Transfer Support**: Vietnamese bank integration with QR code generation
- **Multiple Payment Methods**: Cash on delivery, online payments, bank transfers
- **Payment Tracking**: Order-based payment status management with transaction IDs

### Social Media APIs
- **Facebook Graph API**: Page management, posting, and analytics access
- **Instagram Basic Display API**: Account connection and basic metrics
- **Twitter API**: Account management and posting capabilities

### Development & Deployment
- **Vercel**: Serverless deployment platform with edge functions
- **Vite**: Development server with hot module replacement and build optimization
- **TypeScript**: Compile-time type checking and IDE integration

### UI & Component Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Icon library with consistent design language
- **Recharts**: Data visualization library for analytics dashboards
- **React Hook Form**: Form state management with validation

### Third-party Services
- **Google Fonts**: Typography loading (Nunito Sans, Inter font families)
- **RASA Framework**: Open-source chatbot framework integration
- **QR Code Generation**: Payment QR code creation for Vietnamese banking