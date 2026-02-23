# 🚀 SaaS CRM for Universities

A production-ready, multi-tenant SaaS Customer Relationship Management system built exclusively for Higher Education scaling. This application is architected from the ground up to securely handle nested role-based access controls across **Platform Super Admins**, **University Tenant Admins**, and individual **Conversion Agents**.

![Dashboard Overview](file:///C:/Users/carlos/.gemini/antigravity/brain/ec7cf88c-e6d1-4a2f-b0fa-dc7d6f1b972d/dashboard_and_branding_final_1771796102747.webp)

## 🌟 Core Features

- **Multi-Tenant Architecture**: Strict data isolation enforcing absolute security separating universities, programs, agents, and thousands of distinct leads via Supabase PostgreSQL Row Level Security (RLS).
- **Three Distinct Portals**: 
  - 👑 `/sa/*`: Super Admin (Platform Oversight, Global Subscriptions, Tenant Management)
  - 🎓 `/u/*`: University Admin (Lead Routing, Agent Provisioning, Kanban Customization, Branding)
  - 💼 `/agent/*`: Sales Agent (Isolated Drag-and-Drop Pipeline, Lead Details, Communications)
- **Interactive Kanban Pipeline**: Fluid `@dnd-kit` powered drag-and-drop pipelines that immediately persist status changes and update conversion probabilities asynchronously to the Postgres backend.
- **Dynamic Onboarding & Provisioning**: Platform operators effortlessly onboard universities, while University admins seamlessly provision Agent accounts directly into their tenant domain via Magic Link Emails or explicit encrypted passwords.
- **Whitelabel UX Branding**: Live CSS variable token editing injected at the tenancy root—allowing individual universities to map exact brand hex codes to the interface directly from their `/u/settings/branding` dashboard.

![Portals Testing](file:///C:/Users/carlos/.gemini/antigravity/brain/ec7cf88c-e6d1-4a2f-b0fa-dc7d6f1b972d/all_portals_final_test_1771794103227.webp)

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Edge Functions)
- **Styling**: Tailwind CSS + `shadcn/ui` components
- **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`)
- **Drag & Drop**: `@dnd-kit/core`
- **Data Fetching**: Next.js Server Side Rendering (SSR API bypass routes via `@supabase/ssr` to circumvent UI cache lag)

## 🔒 Security Model

All interactions pass a dual-auth gate:
1. **Next.js Middleware**: Checks JSON Web Token (JWT) validity on initial hydration to block unauthorized route access (`/` instantly redirects to assigned `/sa/`, `/u/`, or `/agent/` logic paths).
2. **Supabase RLS**: Atomic database policy queries to ensure an agent from *University A* fundamentally cannot read even a singular byte of SQL from *University B*. 

![RLS Success & Data Security](file:///C:/Users/carlos/.gemini/antigravity/brain/ec7cf88c-e6d1-4a2f-b0fa-dc7d6f1b972d/rls_fix_success_1771793789114.png)

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` containing your active Supabase instance keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Deploy Database**:
   Push the exact migration schema located in `/supabase/migrations/20260222000000_v2_mega_schema.sql` to your Supabase SQL Editor.

4. **Launch the Dev Server**:
   ```bash
   npm run dev
   ```

## 🎨 Branding Engine

SaaS CRM supports multi-realm color generation. Tenant Admins can manipulate their primary UI colors, sidebar contrasts, and global app accents natively in their application settings, immediately propagating through `tailwind` configurations globally.

![Custom Branding Dashboard](file:///C:/Users/carlos/.gemini/antigravity/brain/ec7cf88c-e6d1-4a2f-b0fa-dc7d6f1b972d/branding_page_screenshot_1771795155271.webp)

---
*Built incrementally with a focus on robust data infrastructure and fluid user interaction.*
![Final Phase View](file:///C:/Users/carlos/.gemini/antigravity/brain/ec7cf88c-e6d1-4a2f-b0fa-dc7d6f1b972d/phase5_final_testing_and_walkthrough_1771805627382.webp)
