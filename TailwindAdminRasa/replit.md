# E-Commerce Admin Dashboard & UI Kit

## Overview

This is a comprehensive e-commerce admin dashboard and UI kit built with React, TypeScript, and modern web technologies. The application provides a complete management system for e-commerce operations, including product management, order processing, customer relationship management, analytics, social media integration, and AI chatbot functionality. The interface is designed in Vietnamese, targeting Vietnamese-speaking users, with a focus on productivity and data management while maintaining a clean, professional aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based single-page application (SPA) architecture with the following key decisions:

- **React with TypeScript**: Provides type safety and better developer experience for component development
- **Vite**: Chosen as the build tool for fast development server and optimized production builds
- **Wouter**: Lightweight client-side routing library instead of React Router for minimal bundle size
- **TanStack Query**: Handles server state management, caching, and data fetching with automatic background updates
- **Shadcn/UI Components**: Comprehensive component library built on Radix UI primitives for accessibility and customization

### UI/UX Design System
The design follows a custom adaptation of Material Design principles optimized for admin dashboard use:

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development with custom design tokens
- **Color Palette**: Light theme with modern blue primary colors (219 94% 56%) for trust and reliability
- **Typography**: Inter font family from Google Fonts for clean, professional appearance
- **Component Architecture**: Modular component system with examples directory for development and testing

### Backend Architecture
Express.js-based REST API with the following architectural choices:

- **Express.js**: Lightweight Node.js framework for rapid API development
- **TypeScript**: Full-stack type safety between frontend and backend
- **Modular Route Structure**: Separated route handlers for different business domains (products, orders, customers, etc.)
- **Middleware Pattern**: Request logging, error handling, and JSON parsing middleware

### Data Storage Solutions
PostgreSQL database with modern ORM and migration tooling:

- **PostgreSQL**: Relational database chosen for complex e-commerce relationships and ACID compliance
- **Neon Database**: Serverless PostgreSQL provider for scalable, managed database hosting
- **Drizzle ORM**: Type-safe ORM providing compile-time query validation and excellent TypeScript integration
- **Schema-First Design**: Centralized schema definition in shared directory for consistent frontend/backend types

### Database Schema Design
Comprehensive e-commerce data model supporting:

- **User Management**: Admin authentication system
- **Product Catalog**: Products with categories, pricing, inventory, and status management
- **Order Management**: Full order lifecycle with items, customer relationships, and status tracking
- **Customer Relationships**: Customer profiles with contact information and status tracking
- **Social Media Integration**: Social account management for multi-platform presence
- **AI Chatbot**: Conversation history and analytics storage

### Authentication & Authorization
Session-based authentication architecture:

- **Express Sessions**: Server-side session management for admin users
- **PostgreSQL Session Store**: Sessions persisted in database for scalability and reliability
- **Role-Based Access**: Admin-only access with expandable role system architecture

### State Management
Client-side state management using modern patterns:

- **Server State**: TanStack Query manages all server-side data with intelligent caching
- **UI State**: React's built-in state management for component-level state
- **Form State**: React Hook Form with Zod validation for type-safe form handling

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting and management
- **Vite**: Development server and build tooling with hot module replacement

### UI & Styling
- **Google Fonts**: Inter font family via CDN for typography
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide React**: Modern icon library for consistent iconography
- **Recharts**: Chart library for analytics visualization

### Backend Services
- **Node.js**: Server runtime environment
- **PostgreSQL**: Primary database system
- **Express.js**: Web application framework

### Development & Build Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

### Validation & Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performance-focused form library
- **Drizzle-Zod**: Integration between database schema and validation

### Data Fetching & State
- **TanStack React Query**: Server state management and caching
- **Date-fns**: Date manipulation and formatting utilities

### Additional Libraries
- **Class Variance Authority**: Type-safe CSS class variants
- **CLSX & Tailwind Merge**: Conditional CSS class handling
- **Embla Carousel**: Touch-friendly carousel components
- **React Day Picker**: Calendar and date selection components

## Recent Changes - September 21, 2025

### Multi-Region Auto-Posting System Deployment
- **Global Infrastructure Setup**: Implemented comprehensive deployment configuration for 13 global regions covering 75+ countries
- **Deployment Platforms**: Added support for Railway, Render, and Vercel with dedicated configuration files
- **Regional Coverage**: Expanded from basic setup to full global coverage across Americas, Europe, Asia Pacific, Middle East, and Africa
- **Centralized Configuration**: Created single source of truth for all supported regions preventing configuration drift
- **Automated Deployment**: Built automated deployment script for multi-region serverless worker setup
- **Production-Ready Guides**: Created comprehensive deployment documentation for global infrastructure setup

### Key Infrastructure Components
- **Brain Server**: Central management server deployable to Railway, Render, or Vercel
- **Regional Workers**: Serverless functions deployed across 13 Vercel regions for optimal IP diversity
- **Queue System**: Redis-based job distribution system for regional worker coordination
- **Database**: PostgreSQL with session storage and comprehensive social media data models

### Deployment Files Added
- `railway.json` - Railway deployment configuration
- `render.yaml` - Render deployment configuration  
- `DEPLOYMENT_GUIDE.md` - Comprehensive multi-region deployment guide
- `deploy-workers.sh` - Automated script for deploying workers to all 13 regions

### Geographic Coverage Matrix
The system now supports optimal regional routing across:
- **US East/West**: Primary coverage for North American markets
- **South America**: Coverage for Brazilian and Latin American markets
- **Europe**: Comprehensive coverage across Western, Central, Southern, and Northern Europe
- **Asia Pacific**: Major coverage including Singapore, Tokyo, Sydney, and Mumbai
- **Middle East & Africa**: Emerging market coverage through Bahrain and Cape Town