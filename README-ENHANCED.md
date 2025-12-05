# Christ University Gated Access Management System - Enhanced Version

A modern, production-ready Progressive Web App (PWA) for managing campus entry and event access at Christ University. Features QR code-based visitor registration, real-time verification, role-based dashboards, and comprehensive event management workflows.

---

## ✨ What's New in This Enhanced Version

### 🎨 Modern UI/UX
- **Professional Design System**: Consistent, reusable UI components (Button, Input, Select, Card, Modal, Badge)
- **Enhanced Animations**: Smooth transitions using Framer Motion
- **Improved Layouts**: Modern, mobile-first responsive design
- **Better Feedback**: Toast notifications for all user actions
- **Loading States**: Skeleton screens and loading indicators

### 📱 PWA Enhancements
- **Full PWA Support**: Install as a native app on mobile and desktop
- **Offline Capabilities**: Service worker with smart caching strategies
- **Install Prompt**: Smart installation prompts with feature showcases
- **Offline Indicator**: Real-time connectivity status
- **App Shortcuts**: Quick access to frequently used features

### 🎯 Improved User Experience
- **Form Validation**: Real-time validation with helpful error messages
- **Auto-formatting**: Phone numbers, dates, and other inputs
- **Better Navigation**: Improved navigation and breadcrumbs
- **Accessibility**: ARIA labels, keyboard navigation, focus indicators
- **Touch-optimized**: 44px minimum touch targets for mobile

### 🔧 Developer Experience
- **Reusable Components**: Well-documented component library
- **Utility Functions**: Comprehensive validation and formatting utilities
- **Constants**: Centralized configuration management
- **Type Safety**: Enhanced TypeScript support
- **Clean Code**: Organized file structure

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [UI Components](#ui-components)
- [Utility Functions](#utility-functions)
- [PWA Features](#pwa-features)
- [User Roles](#user-roles--permissions)
- [API Endpoints](#api-endpoints)
- [Security](#security-features)
- [Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Features
- ✅ **Color-Coded QR System** - Blue (Students), Amber (Speakers), Maroon (VIPs)
- ✅ **Event Approval Workflow** - Organizers request → CSO approves
- ✅ **Bulk QR Generation** - Register multiple speakers/VIPs at once
- ✅ **Real-time Verification** - Instant QR code scanning at gates
- ✅ **PDF Access Passes** - Downloadable branded passes
- ✅ **Capacity Management** - Automatic tracking and limits
- ✅ **Role-Based Access Control** - 4 user roles with specific permissions

### Enhanced Features
- ✅ **Progressive Web App** - Install and use like a native app
- ✅ **Offline Support** - Works without internet connection
- ✅ **Toast Notifications** - Beautiful, non-intrusive feedback
- ✅ **Form Validation** - Real-time validation with helpful hints
- ✅ **Loading States** - Skeleton screens and progress indicators
- ✅ **Responsive Design** - Optimized for all devices
- ✅ **Accessibility** - WCAG 2.1 compliant
- ✅ **Modern UI** - Professional, clean interface

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, React 18
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Libraries**: 
  - `jsPDF` - PDF generation
  - `qrcode` - QR code generation
  - `html5-qrcode` - QR scanning
  - `framer-motion` - Animations
  - `date-fns` - Date manipulation

---

## 📦 Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Supabase account (free tier works)

### Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd universitygatedv2

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run development server
npm run dev
```

Access at: `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Feature Flags
# ENABLE_NOTIFICATIONS=true
# ENABLE_EMAIL_ALERTS=false
```

Get Supabase credentials from: [Supabase Dashboard](https://app.supabase.com) → Project Settings → API

---

## 🎨 UI Components

### Available Components

The enhanced version includes a comprehensive UI component library:

```typescript
import { 
  Button, 
  Input, 
  Select, 
  Card, 
  Modal, 
  Badge, 
  Skeleton,
  useToast 
} from '@/components/ui';

// Example Usage
<Button variant="primary" size="lg" isLoading={loading}>
  Submit
</Button>

<Input 
  label="Email" 
  error={errors.email}
  leftIcon={<EmailIcon />}
/>

<Card title="Welcome" subtitle="Get started">
  <p>Card content here</p>
</Card>
```

### Component Features

- **Button**: Multiple variants (primary, secondary, tertiary, danger, outline, ghost)
- **Input**: Built-in validation, icons, character count, helper text
- **Select**: Custom styling, error states
- **Card**: Quick action cards, stats cards, standard cards
- **Modal**: Confirmation modals, custom modals, keyboard support
- **Badge**: Status badges, category badges, dot indicators
- **Skeleton**: Loading placeholders for better UX
- **Toast**: Non-intrusive notifications with auto-dismiss

---

## 🔧 Utility Functions

### Validation

```typescript
import { 
  validateEmail, 
  validatePhone, 
  validateName,
  validateForm 
} from '@/lib/utils';

// Validate email
const { isValid, error } = validateEmail('user@example.com');

// Validate entire form
const result = validateForm(formData, {
  email: validateEmail,
  phone: validatePhone,
  name: validateName
});
```

### Formatting

```typescript
import { 
  formatPhoneNumber, 
  formatDate, 
  formatRelativeTime,
  capitalizeWords 
} from '@/lib/utils';

// Format phone: +91 98765-43210
const phone = formatPhoneNumber('9876543210');

// Format date: 15/10/2025
const date = formatDate('2025-10-15', 'short');

// Relative time: "2 hours ago"
const relative = formatRelativeTime(new Date());
```

---

## 📱 PWA Features

### Installation
1. Visit the website on mobile or desktop
2. Look for "Install App" prompt (appears after 30 seconds)
3. Click "Install Now" to add to home screen
4. Access like a native app with offline support

### Offline Capabilities
- **Static Assets**: Cached for offline access
- **API Requests**: Smart caching with network-first strategy
- **QR Codes**: View previously generated QR codes offline
- **Forms**: Auto-save drafts in localStorage

### App Shortcuts
- Quick access to "Register for Event"
- Quick access to "Retrieve QR Code"

---

## 👥 User Roles & Permissions

### 1. Visitor (Public - No Login)
- Register for approved events
- Download QR code (student category)
- View event details
- Retrieve lost QR codes

### 2. Security Guard (`/guard`)
- Scan visitor QR codes
- Verify visitor details
- View scan history
- Real-time verification status

### 3. Event Organiser (`/organiser`)
- Request new events
- View request status
- Generate bulk QR codes
- Download PDF passes

### 4. Chief Security Officer (`/cso`)
- View all event requests
- Approve or reject events
- View all visitors
- System-wide oversight

---

## 🔌 API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/registerVisitor` | POST | Register new visitor |
| `/api/verifyVisitor` | GET | Verify visitor by ID |
| `/api/approved-events` | GET | Get approved events list |

### Protected Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | User authentication |
| `/api/event-requests` | GET/POST | Event request management |
| `/api/cso/approve-event` | POST | Approve/reject events |
| `/api/visitors` | GET | Get all visitors |
| `/api/updateStatus` | POST | Update visitor status |

---

## 🔒 Security Features

- ✅ Role-based access control (RBAC)
- ✅ Session management via localStorage
- ✅ Protected API routes
- ✅ Supabase Row Level Security
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (via Supabase)
- ✅ XSS protection
- ✅ UUID-based unique IDs
- ✅ HTTPS in production

---

## 🚀 Running the Application

### Development

```bash
npm run dev
```

Access points:
- Homepage: `http://localhost:3000`
- Visitor Registration: `/visitor-register`
- Guard Login: `/login?role=guard`
- Organiser Login: `/login?role=organiser`
- CSO Login: `/login?role=cso`

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 🚢 Production Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
```bash
git push origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables
   - Deploy

3. **Environment Variables in Vercel**:
```
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Test users created
- [ ] Default passwords changed
- [ ] Test all user flows
- [ ] Enable Supabase RLS policies
- [ ] Test QR code generation
- [ ] Verify PDF downloads
- [ ] Test on multiple devices
- [ ] PWA installation works
- [ ] Offline mode works

---

## 🐛 Troubleshooting

### PWA Not Installing
- Ensure HTTPS is enabled (required for PWA)
- Check browser console for service worker errors
- Verify `manifest.json` is accessible
- Clear browser cache and try again

### QR Code Not Generating
- Check `NEXT_PUBLIC_APP_URL` in `.env.local`
- Verify visitor exists in database
- Check browser console for errors
- Ensure jsPDF library is installed

### Database Connection Failed
- Verify Supabase credentials in `.env.local`
- Check Supabase project is active
- Ensure database schema is deployed
- Check network connectivity

### Build Fails
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall dependencies: `npm install`
- Try building again: `npm run build`

### Components Not Styling Correctly
- Ensure Tailwind CSS is configured properly
- Check `globals.css` is imported in `_app.tsx`
- Rebuild the project
- Clear browser cache

---

## 📱 Mobile Optimization

- ✅ Touch-friendly buttons (44x44px minimum)
- ✅ Responsive typography (rem-based)
- ✅ Stack layouts on small screens
- ✅ Mobile-optimized scanner
- ✅ Pull-to-refresh support
- ✅ PWA installation prompt

**Supported Devices**:
- iPhone (iOS Safari 13+)
- Android (Chrome 80+)
- iPad
- Desktop browsers

---

## 🎨 Customization

### Branding
- Replace `/public/christunilogo.png` with your logo
- Replace `/public/christunifavcion.png` with your favicon
- Update colors in `tailwind.config.ts`
- Modify `lib/constants.ts` for university info

### Features
- Modify PDF layout in `QRGenerator.tsx`
- Customize event workflow in `cso.tsx`
- Add fields to registration form
- Adjust validation rules in `lib/utils/validation.ts`

---

## 📊 File Structure

```
universitygatedv2/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── Navbar.tsx
│   ├── QRGenerator.tsx
│   ├── QRScanner.tsx
│   ├── PhotoCapture.tsx
│   ├── PWAProvider.tsx
│   └── PWAInstallPrompt.tsx
├── lib/
│   ├── utils/
│   │   ├── validation.ts   # Validation functions
│   │   ├── formatting.ts   # Formatting utilities
│   │   └── index.ts
│   └── constants.ts        # App constants
├── pages/
│   ├── api/                # API routes
│   ├── _app.tsx            # App wrapper
│   ├── _document.tsx       # HTML document
│   ├── index.tsx           # Homepage
│   ├── login.tsx
│   ├── guard.tsx
│   ├── organiser.tsx
│   ├── cso.tsx
│   └── visitor-register.tsx
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # App icons
├── styles/
│   └── globals.css        # Global styles
├── .env.example           # Example environment file
└── README-ENHANCED.md     # This file
```

---

## 📄 License

Copyright © 2025 Christ University. All rights reserved.

---

## 🤝 Support

- **Documentation**: This README and inline code comments
- **Database Reference**: `DATABASE.sql`
- **University Website**: [christuniversity.in](https://christuniversity.in)
- **Emergency Contact**: 080-4012-9100

---

## 🎯 Quick Reference

### Common Tasks

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Clear cache and rebuild
rm -rf .next node_modules && npm install && npm run dev
```

### Environment Variables Quick Setup

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

---

**Version**: 2.0.0 - Production Ready Enhanced Edition  
**Last Updated**: October 31, 2025  
**Built for**: Christ University with ❤️
