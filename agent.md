# BUILD ERP — Design System Rules

## Brand Identity
- **Product:** Multi-Store Building Materials ERP
- **Category:** B2B Industrial SaaS
- **Users:** Building material business owners, counter staff, accountants
- **Personality:** Strong, Professional, Trustworthy, Modern, Energetic
- **Purpose:** Fast, reliable construction material management

## Color System
- **Primary Brand:** #2563EB (Royal Blue) — trust, strength, technology
- **Secondary:** #4F46E5 (Indigo) — purchase, reports, depth
- **Accent:** #F97316 (Orange) — attention, action, warmth
- **Success:** #10B981 (Emerald) — payments, completion, profit
- **Warning:** #F59E0B (Amber) — pending, drafts, alerts
- **Danger:** #EF4444 (Red) — cancel, damage, critical
- **Info:** #06B6D4 (Cyan) — suppliers, transfers, info
- **Returns:** #8B5CF6 (Purple) — returns, audit, advanced
- **Background:** #F8FAFC, Surface: #FFFFFF, Border: #E2E8F0
- **Text:** #0F172A (primary), #475569 (secondary), #64748B (muted)

## Gradients (use sparingly)
- Primary: 135deg, #2563EB → #4F46E5
- Orange: 135deg, #F97316 → #FB923C
- Success: 135deg, #10B981 → #34D399
- Purple: 135deg, #8B5CF6 → #A78BFA

## Typography
- **Font:** Inter (primary), Noto Sans Devanagari (Hindi support)
- **Sizes:** Title 24-28px, Section 18-20px, Card 15-17px, Body 14-16px, Table 13-14px, Helper 12-13px
- **Amounts:** Tabular nums, weight 600-700, right-aligned, ₹ format

## Icon System
- **Library:** Lucide Icons (outline, consistent stroke)
- **Sizes:** Nav 20px, Button 16-18px, Status 14px, Feature 24px

## Border Radius
- Input/Button: 10-12px, Card: 14-16px, Modal: 18px, Badge: Full pill

## Shadows
- Cards: subtle (0 1px 2px rgba(0,0,0,0.05))
- Dropdowns: medium
- Modals: strong, controlled

## Component Rules
- No browser alert/confirm/prompt — use custom modals/toasts
- No browser select/date — use custom themed components
- Keyboard-friendly forms (Enter → next field)
- No number input spinners
- Custom searchable selects for all dropdowns
- Skeleton loaders for all async data
- Empty states for all lists
- Error states with retry
- Sticky totals for transaction forms
- Sticky action bars on mobile

## Animation
- Smooth transitions (150-200ms)
- Micro-interactions for buttons
- Framer Motion for page transitions
- No slow or heavy animations

## Quality Checklist
✓ Premium industrial SaaS look
✓ Easy for non-technical users
✓ Consistent brand colors
✓ Professional typography
✓ One icon system (Lucide)
✓ Reusable components
✓ Production-ready
✓ No demo/template feel
