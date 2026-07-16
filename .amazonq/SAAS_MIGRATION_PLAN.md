# SaaS Migration Plan — M&M Parcel Delivery System

> Last updated: 2025
> Status tracking: ✅ Completed | 🔄 In Progress | ⬜ Not Started

---

## Overview

Migrating the M&M Parcel Delivery System into a multi-tenant SaaS product with three
separate app shells, role-based shell assignment, branch-level branding inheritance,
and a super admin layer that spans all tenants.

---

## Tenant Model

```
Super Admin (cross-tenant, sees everything)
└── Tenant (e.g. M&M Logistics)
    ├── Branch / Station A
    ├── Branch / Station B
    └── Branch / Station C
```

- One company = one tenant
- A tenant has multiple branches (stations)
- Each branch inherits branding from the tenant admin unless overridden at branch level

---

## Role → Shell Assignment

| Role         | Shell              | Notes                                              |
|--------------|--------------------|----------------------------------------------------|
| SUPER_ADMIN  | Super Admin Shell  | Cross-tenant, sees all tenants                     |
| ADMIN        | Admin Shell        | Tenant-scoped only                                 |
| MANAGER      | Delivery Hub       | Can switch to Parcel Hub with full FRONTDESK access|
| FRONTDESK    | Parcel Hub         | Locked to Parcel Hub                               |
| CALLER       | Delivery Hub       | Locked to Delivery Hub (call center pages only)    |
| RIDER        | Rider App          | Unchanged — /rider/* routes                        |
| VENDOR       | Partner Portal     | Unchanged — /partner/* routes                      |

---

## URL Strategy

Prefix by shell for clean SaaS separation:

| Shell         | Prefix       |
|---------------|--------------|
| Parcel Hub    | /parcel/*    |
| Delivery Hub  | /delivery/*  |
| Admin Shell   | /admin/*     |
| Rider App     | /rider/*     (unchanged) |
| Partner Portal| /partner/*   (unchanged) |
| Public        | /track, /scan, /receive, /login, etc. (unchanged) |

---

## Shell 1 — Parcel Hub (`/parcel/*`)

**Roles:** FRONTDESK (locked), MANAGER (via shell switcher)

### Pages
| Page                  | Current Route             | New Route                        |
|-----------------------|---------------------------|----------------------------------|
| Parcel Intake         | /parcel-intake            | /parcel/intake                   |
| Parcel Search         | /parcel-search            | /parcel/search                   |
| Smart Search          | /smart-search             | /parcel/smart-search             |
| Parcel Edit           | /parcel-edit              | /parcel/edit                     |
| Parcel Transfer       | /parcel-transfer          | /parcel/transfer                 |
| Incoming Parcels      | /incoming-parcels         | /parcel/incoming                 |
| Outgoing Parcels      | /outgoing-parcels         | /parcel/outgoing                 |
| Shelf & Address Mgmt  | /shelf-management         | /parcel/shelf                    |
| Pickup Request        | /pickup-request           | /parcel/pickup                   |
| Driver Tracker        | /driver-tracker           | /parcel/driver-tracker           |
| Driver Tracker Detail | /driver-tracker/:phoneKey | /parcel/driver-tracker/:phoneKey |
| Branch Settings       | (new)                     | /parcel/settings                 |
| Preferences           | /preferences              | /parcel/preferences              |
| Help                  | /help                     | /parcel/help                     |

---

## Shell 2 — Delivery Hub (`/delivery/*`)

**Roles:** MANAGER (full access), CALLER (call center pages only)

### Pages
| Page                      | Current Route                  | New Route                          | Roles           |
|---------------------------|--------------------------------|------------------------------------|-----------------|
| Package Assignments       | /package-assignments           | /delivery/assignments              | MANAGER         |
| Rider Selection           | /rider-selection               | /delivery/rider-selection          | MANAGER         |
| Active Deliveries         | /active-deliveries             | /delivery/active                   | MANAGER         |

| Reconciliation            | /reconciliation                | /delivery/reconciliation           | MANAGER         |
| Reconciliation Analytics  | /reconciliation-analytics      | /delivery/analytics                | MANAGER         |
| Rider Detail              | /rider-detail                  | /delivery/rider-detail             | MANAGER         |
| Financial Dashboard       | /financial-dashboard           | /delivery/financial                | MANAGER         |
| Fuel Requests (Mgr)       | /admin/fuel-requests           | /delivery/fuel-requests            | MANAGER         |
| Pre-Delivery Queue        | /call-center                   | /delivery/call-center              | MANAGER, CALLER |
| Post-Delivery Follow-Up   | /call-center/follow-up         | /delivery/call-center/follow-up    | CALLER          |
| Home Delivery Watchlist   | /call-center/home-delivery     | /delivery/call-center/home-delivery| CALLER          |
| Smart Search              | /smart-search                  | /delivery/smart-search             | MANAGER, CALLER |
| Branch Settings           | (new)                          | /delivery/settings                 | MANAGER         |
| Preferences               | /preferences                   | /delivery/preferences              | MANAGER, CALLER |
| Help                      | /help                          | /delivery/help                     | MANAGER, CALLER |

---

## Shell 3 — Admin Shell (`/admin/*`)

**Roles:** ADMIN (tenant-scoped), SUPER_ADMIN (cross-tenant)

### Pages
| Page                      | Current Route              | New Route                    | Roles                    |
|---------------------------|----------------------------|------------------------------|--------------------------|
| Dashboard / Statistics    | /admin/dashboard           | /admin/dashboard             | ADMIN, SUPER_ADMIN       |
| Station Management        | /admin/stations            | /admin/stations              | ADMIN, SUPER_ADMIN       |
| User Management           | /admin/users               | /admin/users                 | ADMIN, SUPER_ADMIN       |
| System Parcels Overview   | /admin/parcels             | /admin/parcels               | ADMIN, SUPER_ADMIN       |
| Admin Reconciliation      | /admin/reconciliation      | /admin/reconciliation        | ADMIN, SUPER_ADMIN       |
| Financial Reports         | /admin/financial-reports   | /admin/financial-reports     | ADMIN, SUPER_ADMIN       |
| Financial Dashboard       | /admin/financial           | /admin/financial             | ADMIN, SUPER_ADMIN       |
| System Logs               | /admin/system-logs         | /admin/system-logs           | ADMIN, SUPER_ADMIN       |
| Fuel Requests             | /admin/fuel-requests       | /admin/fuel-requests         | ADMIN, SUPER_ADMIN       |
| Tenant Management         | (new)                      | /admin/tenants               | SUPER_ADMIN only         |
| Cross-Tenant Analytics    | (new)                      | /admin/analytics             | SUPER_ADMIN only         |
| Tenant Settings           | (new)                      | /admin/settings              | ADMIN, SUPER_ADMIN       |

---

## Branding Inheritance

Each branch (station) has a settings page for branding customization.
If a branch has not set its own branding, it inherits from the tenant (company) admin settings.

### Branding fields
- Company / Branch name
- Logo (image URL or upload)
- Primary color
- Secondary color
- Favicon

### Inheritance chain
```
Super Admin defaults
  └── Tenant Admin settings  ← ADMIN sets this at /admin/settings
        └── Branch settings  ← MANAGER sets this at /parcel/settings or /delivery/settings
              └── Applied to the shell at runtime via BrandingContext
```

### Implementation approach
- New `BrandingContext` that resolves: branch settings → tenant settings → system defaults
- Context reads from API on login (backend provides resolved branding per user/branch)
- Applied via CSS variables or Tailwind config injection at runtime

---

## Shell Switcher (MANAGER only)

- A toggle/button in the Navbar (not sidebar) visible only to MANAGER role
- Switches between Parcel Hub (`/parcel/*`) and Delivery Hub (`/delivery/*`)
- State persisted in localStorage so refresh keeps the user on the same shell
- When switching to Parcel Hub, MANAGER gets full FRONTDESK access (all parcel pages)
- When switching back to Delivery Hub, returns to last visited delivery page

---

## New Roles to Add

| Role        | Description                              |
|-------------|------------------------------------------|
| SUPER_ADMIN | Cross-tenant, sees all tenants and data  |

All other roles remain the same, just scoped to their tenant.

---

## New Contexts Needed

| Context          | Purpose                                                        |
|------------------|----------------------------------------------------------------|
| BrandingContext   | Resolves and provides branding (logo, colors) per branch/tenant|
| TenantContext     | Provides current tenant info (id, name, plan, branches)        |

---

## New Layouts Needed

| Layout            | Used by                  | Notes                                      |
|-------------------|--------------------------|--------------------------------------------|
| ParcelLayout      | Parcel Hub shell         | MainLayout variant with Parcel Hub nav     |
| DeliveryLayout    | Delivery Hub shell       | MainLayout variant with Delivery Hub nav   |
| AdminLayout       | Admin Shell              | MainLayout variant with Admin nav          |
| SuperAdminLayout  | Super Admin shell        | AdminLayout + tenant switcher banner       |

All layouts share the same base MainLayout structure (Navbar + Sidebar + content area).
Branding (colors, logo) is injected via BrandingContext.

---

## Migration Phases

### Phase 1 — Foundation ✅
- [x] Add `SUPER_ADMIN` to UserRole type (`src/types/index.ts`, `src/contexts/StationContext.tsx`)
- [x] Create `BrandingContext` with inheritance logic (branch → tenant → default) (`src/contexts/BrandingContext.tsx`)
- [x] Create `TenantContext` with current tenant/branch info (`src/contexts/TenantContext.tsx`)
- [x] Create `ParcelLayout`, `DeliveryLayout`, `AdminLayout`, `SuperAdminLayout` (`src/layouts/`)
- [x] Add shell switcher component to Navbar (MANAGER only) (`src/layouts/Navbar.tsx`)
- [x] Update `ProtectedRoute` for SUPER_ADMIN + shell-based redirects
- [x] Wire `BrandingProvider` and `TenantProvider` into `App.tsx`

### Phase 2 — Route Migration ✅
- [x] Migrate Parcel Hub routes to `/parcel/*`
- [x] Migrate Delivery Hub routes to `/delivery/*`
- [x] Keep `/admin/*` routes, add SUPER_ADMIN access + new pages
- [x] Add redirects from old routes to new routes (backward compat)
- [ ] Update all `navigate()` calls across screens to use new paths (in progress — screens still use old paths internally)

### Phase 3 — Sidebar Restructure ✅
- [x] Split `Sidebar.tsx` into `ParcelSidebar`, `DeliverySidebar`, `AdminSidebar`
- [x] Each sidebar only shows pages for its shell and the user's role
- [ ] Old `Sidebar.tsx` kept for now — remove in Phase 6 cleanup

### Phase 4 — Branding System ⬜
- [ ] Build `/parcel/settings` and `/delivery/settings` branch settings page
- [ ] Build `/admin/settings` tenant settings page
- [ ] Wire `BrandingContext` to apply logo + colors at runtime
- [ ] Super Admin sees tenant switcher to preview any tenant's branding

### Phase 5 — Super Admin Pages ⬜
- [ ] `/admin/tenants` — list/manage all tenants
- [ ] `/admin/analytics` — cross-tenant analytics dashboard

### Phase 6 — Cleanup ⬜
- [ ] Remove old flat routes from `App.tsx`
- [ ] Remove old `Sidebar.tsx` single-file nav
- [ ] Audit and remove any hardcoded role checks that conflict with new structure

---

## Files That Will Change

| File                              | Change                                              |
|-----------------------------------|-----------------------------------------------------|
| `src/App.tsx`                     | Full route restructure                              |
| `src/layouts/Sidebar.tsx`         | Split into 3 sidebar files                          |
| `src/layouts/MainLayout.tsx`      | Accept layout variant prop or replaced by 3 layouts |
| `src/layouts/Navbar.tsx`          | Add shell switcher for MANAGER                      |
| `src/types/index.ts`              | Add SUPER_ADMIN to UserRole                         |
| `src/contexts/StationContext.tsx` | Integrate TenantContext or extend with tenant info  |
| `src/components/ProtectedRoute.tsx`| Handle SUPER_ADMIN role + shell-based redirects    |
| All screens with `navigate()`     | Update paths to new prefixed routes                 |

---

## Files That Stay Unchanged

| File/Folder                        | Reason                          |
|------------------------------------|---------------------------------|
| `src/screens/RiderDashboard/`      | Rider app untouched             |
| `src/screens/RiderHistory/`        | Rider app untouched             |
| `src/screens/RiderEarnings/`       | Rider app untouched             |
| `src/screens/RiderFuelRequest/`    | Rider app untouched             |
| `src/screens/PartnerPortal/`       | Partner portal untouched        |
| `src/screens/TrackParcel/`         | Public route untouched          |
| `src/screens/CustomerParcelHub/`   | Public route untouched          |
| `src/screens/ParcelScan/`          | Public route untouched          |
| `src/screens/Login/`               | Auth route untouched            |
| All password reset screens         | Auth routes untouched           |

---

## Open Questions (Backend)

These need backend confirmation before frontend implementation:

- [ ] Does the login response include `tenantId`, `branchId`, and resolved branding?
- [ ] Is there a `/branding` or `/settings` endpoint per branch and per tenant?
- [ ] Does the JWT include the user's shell assignment or is it derived from role?
- [ ] Is `SUPER_ADMIN` a new role in the backend or a flag on the existing ADMIN role?
- [ ] Will there be a `/tenants` endpoint for Super Admin to list all tenants?

---
