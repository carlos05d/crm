# Design System: University SaaS CRM
**Project ID:** TBD (Will be populated by stitch-loop)

## 1. Visual Theme & Atmosphere
The platform embodies a **Modern, Institutional, and Calm** aesthetic. It is designed to feel highly trustworthy, professional, and scalable—akin to enterprise tools like Stripe or linear, but tailored for university decision-makers. The atmosphere is structurally clean, avoiding any startup-hype elements like neon glows, heavy glassmorphism, or excessive gradients. It prioritizes data clarity and minimal clutter to support agents working in the CRM daily.

## 2. Color Palette & Roles
*   **Deep Institutional Navy** (#1E3A8A): The primary brand color. Used for prominent headers, primary buttons, and key interactive elements. Conveys authority and trust.
*   **Academic Forest Green** (#14532D): The secondary brand color. Used for success states, secondary accents, and subtle highlights to infuse the academic vibe.
*   **Soft Sky Blue** (#3B82F6): The accent color. Used for active states, link highlights, and subtle interactive feedback.
*   **Main Background** (#F9FAFB): A soft, off-white gray used for the main application background to reduce eye strain.
*   **Card Background** (#FFFFFF): Pure white. Used for containers to create clean separation from the main background.
*   **Border Gray** (#E5E7EB): A subtle, light gray used for dividing sections, card borders, and input outlines.
*   **Dark Mode Background (Secondary)** (#0F172A): Deep slate. Used for the application background when dark mode is toggled.
*   **Dark Mode Card (Secondary)** (#1E293B): Lighter slate. Used for containers in dark mode.

## 3. Typography Rules
*   **Font Family:** Inter (Sans-serif) is used exclusively across the entire application to ensure a modern, clean, and highly readable SaaS aesthetic. Absolutely no serif fonts are used.
*   **Headers:** Inter SemiBold or Bold. Used for page titles, card headers, and significant structural text.
*   **Body:** Inter Regular or Medium. Used for all paragraphs, labels, and data points.
*   **Character:** The typography should feel extremely structured, reliable, and legible at small sizes (crucial for dense CRM tables and pipelines).

## 4. Component Stylings
*   **Buttons:** 
    *   *Primary:* Solid "Deep Institutional Navy" background with white text. Subtly rounded corners (8px). No heavy shadows.
    *   *Secondary:* White background with a "Deep Institutional Navy" border and text.
    *   *Danger:* Soft red background for destructive actions.
*   **Cards/Containers:** Pure white backgrounds with a subtle gray border (#E5E7EB). Soft rounded corners (8px–12px). They should use a very faint, minimal drop shadow just to lift them off the #F9FAFB background. Heavy shadows are strictly prohibited.
*   **Inputs/Forms:** Clean, bordered inputs using the "Border Gray" stroke. They should have a slight inner shadow or just be flat white. Focus states should ring with "Soft Sky Blue".
*   **Sidebar:** Light background (#F9FAFB or white) with a clear, high-contrast active state indicator (e.g., a "Deep Institutional Navy" left border highlight or subtle background tint).

## 5. Layout Principles
*   **Spacing System:** Strictly adhering to an 8px grid system (e.g., margins and padding of 8px, 16px, 24px, 32px).
*   **Separation:** Use clean borders and whitespace rather than alternating background colors to separate sections.
*   **Dashboard Structure:** KPI cards should sit at the top. Data should be presented in clean, well-aligned grids or tables. Minimal clutter is paramount. 
*   **Hierarchy:** Visual hierarchy must be extremely strong, using size and weight to guide the eye smoothly down the page.

## 6. Design System Notes for Stitch Generation
> **For Stitch:** Generate this page using a "Modern & Trustworthy SaaS Classic" aesthetic tailored for university admins. Use a clean white/light background (#F9FAFB for app bg, #FFFFFF for cards). Implement subtle borders (#E5E7EB) and soft rounded corners (8-12px) for all containers and buttons. The primary accent color is Deep Institutional Navy (#1E3A8A), supported by Forest Green (#14532D) and Sky Blue (#3B82F6). Strictly use the 'Inter' sans-serif font for all typography. Avoid neon glows, heavy gradients, glassmorphism, or serif fonts. The design must feel professional, calm, highly structured, and data-focused.
