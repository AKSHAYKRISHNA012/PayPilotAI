# DESIGN.md: PayPilot AI Enterprise Design System

Inspired by **Vensure HCM, Gusto, and Rippling**. Built for trust, data density, readability, and speed.

---

## 1. Color Tokens

### Surface & Background Tokens
- **Canvas / Background**: `#FFFFFF` (White)
- **App Wrapper & Slices**: `#F8FAFC` (`slate-50`)
- **Card Fill**: `#FFFFFF` with `border border-slate-200`
- **Subtle Surface Highlight**: `#F1F5F9` (`slate-100`)

### Brand & Primary Colors
- **Primary Navy**: `#0F172A` (`slate-900`)
- **Primary Accent Indigo**: `#4338CA` (`indigo-700`) / `#4F46E5` (`indigo-600`)
- **Secondary Accent Slate**: `#64748B` (`slate-500`)

### Semantic State Colors
- **Success / Clean**:
  - Surface: `#F0FDF4` (`emerald-50`)
  - Border: `#BBF7D0` (`emerald-200`)
  - Text: `#15803D` (`emerald-700`)
- **Warning / Discrepancy**:
  - Surface: `#FFFBEB` (`amber-50`)
  - Border: `#FDE68A` (`amber-200`)
  - Text: `#92400E` (`amber-800`)
- **Critical / Blocker**:
  - Surface: `#FEF2F2` (`red-50`)
  - Border: `#FECACA` (`red-200`)
  - Text: `#B91C1C` (`red-700`)

---

## 2. Typography Scale (Inter)

- **Headings (Page Title)**: `text-2xl` (`24px`), `font-bold`, `tracking-tight`, `text-slate-900`
- **Section Titles**: `text-base` / `text-sm`, `font-bold`, `text-slate-900`
- **Body Text**: `text-xs` (`12px`), `font-normal` / `font-medium`, `text-slate-600`
- **Meta / Labels**: `text-[10px]` / `text-[11px]`, `font-semibold`, `uppercase`, `tracking-wider`, `text-slate-500`
- **Financial & Metrics**: `font-mono`, `font-semibold`, `tabular-nums` for precise currency alignment

---

## 3. Spatial System (8pt Grid)

- **Micro padding**: `px-2 py-1` (4px / 8px)
- **Card padding**: `p-4` or `p-5` (16px / 20px)
- **Section gap**: `gap-3.5` / `gap-4` / `space-y-6`
- **Border Radius**: Moderate rounding (`rounded-md` = 6px, `rounded-lg` = 8px). Avoid pill/bubble styles on cards.
- **Borders**: Single-pixel clean borders (`border border-slate-200`).
- **Shadows**: Minimal (`shadow-xs` or none).

---

## 4. Components & UX Standards

- **Buttons**:
  - Primary: `bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-3.5 py-2`
  - Secondary: `bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg px-3.5 py-2`
  - Dark: `bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg px-3.5 py-2`
- **Tables**:
  - Header: `bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider py-2.5 px-4`
  - Rows: `hover:bg-slate-50/70 border-b border-slate-100 py-3 px-4 font-medium`
- **Modals**:
  - Backdrop: `bg-slate-900/40`
  - Frame: `bg-white border border-slate-200 rounded-lg shadow-xl`
  - Header: `bg-slate-50 border-b border-slate-200 p-4`
