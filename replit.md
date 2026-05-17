# replit.md

## Overview

This is a full-stack bus tracking application for Adichunchanagiri Institute of Technology (AIT). The system enables real-time bus location tracking with separate interfaces for students (to view bus locations) and drivers (to broadcast their location). The application features a React frontend with shadcn/ui components, an Express.js backend with WebSocket support for real-time updates, and dual database support using both MongoDB (primary) and PostgreSQL (with Drizzle ORM as backup).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for monorepo structure
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Real-time Communication**: WebSocket server for live location updates
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Design**: RESTful endpoints with WebSocket enhancements for real-time features
- **Middleware**: Custom logging, error handling, and request processing

### Data Storage Solutions
- **Primary Database**: MongoDB Atlas with Mongoose ODM
  - Collections for drivers, buses, and bus locations
  - Connection pooling and automatic reconnection handling
  - Graceful fallback to memory storage if MongoDB is unavailable
- **Secondary Database**: PostgreSQL with Drizzle ORM
  - Configured as backup/alternative data store
  - Schema-first approach with TypeScript integration
  - Migration support through Drizzle Kit

### Authentication and Authorization
- **Driver Authentication**: JWT tokens with secure session management
- **Password Security**: bcrypt hashing with salt rounds
- **WebSocket Authentication**: Token-based authentication for real-time connections
- **Session Persistence**: Local storage for driver session continuity

### External Dependencies
- **Google Maps Integration**: Google Maps JavaScript API for map rendering and bus location visualization
- **MongoDB Atlas**: Cloud database service with connection string configuration
- **Neon Database**: PostgreSQL hosting service with serverless driver
- **Real-time Communication**: Custom WebSocket implementation for live location broadcasting
- **UI Components**: Extensive use of Radix UI primitives for accessible, headless components
- **Font Integration**: Google Fonts (Roboto, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Icon Library**: Font Awesome for comprehensive icon coverage

The architecture follows a monorepo structure with clear separation between client, server, and shared code. The system is designed for scalability with real-time capabilities and robust error handling, making it suitable for production deployment in educational institutions.