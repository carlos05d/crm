# Site Vision & Roadmap: University SaaS CRM

## 1. Vision
The platform is a multi-tenant SaaS CRM built specifically for University Admissions. It must allow Super Admins to manage multiple universities, University Admins to configure their specific tenant (subdomain), and Agents to manage incoming student leads via a Kanban pipeline. 

## 2. Target Audience
*   **Super Admins:** Need a high-level, birds-eye view of all universities, subscriptions, and platform health.
*   **University Admins:** Need to configure their custom branding, departments, user invites, and view analytics.
*   **Agents:** Need a fast, robust workspace to process leads, move them through stages, and communicate.
*   **Students (Public):** Need a clean, trustworthy landing page on the university's subdomain to submit their information.

## 3. Tech Stack Context
We are generating UI components for a Next.js (App Router) environment. The styling is Tailwind CSS + shadcn/ui. 

## 4. Sitemap (Current)
*   [x] `landing-page` - The generic marketing page for the SaaS CRM platform (`/app/page.tsx`).
*   [x] `tenant-public-form` - The public landing page & lead capture form on a university's subdomain (`/[domain]/page.tsx`).
*   [x] `dashboard-super-admin` - The global platform dashboard for managing universities.
*   [x] `dashboard-tenant-admin` - The university-specific dashboard for configuration and analytics.
*   [x] `dashboard-agent-kanban` - The primary workspace for agents managing student leads.
*   [x] `login-screen` - The authentication page for internal users.

## 5. Roadmap (Backlog for Stitch Generation)
1. `login-screen` - A clean, trusting sign-in portal.
2. `dashboard-super-admin` - A complex data-table view showing all universities and their active status.
3. `dashboard-tenant-admin` - A settings page for updating the university logo, colors, and departments.
4. `dashboard-agent-kanban` - A drag-and-drop Kanban board layout for tracking leads.
5. `tenant-public-form` - A beautiful, high-converting lead capture page designed to sit on a subdomain.
6. `landing-page` - The main marketing site selling the CRM to prospective university decision-makers.

## 6. Creative Freedom (Future Ideas)
*   An analytics dashboard specifically tracking enrollment conversion rates.
*   A "Communication Log" drawer component that slides out when an agent clicks a lead to view their email/whatsapp history.
*   An onboarding wizard for the Super Admin creating a new University tenant.
