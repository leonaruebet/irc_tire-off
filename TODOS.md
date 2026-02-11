# TireTrack - Tire Age Tracking System Implementation

## Fix Per-Tire Mileage (กม.) Mismatch After Import
### Done
- [x] Add `install_odometer_km Int?` to TireChange schema ~0.1d #import 2026-02-11
- [x] Store per-tire odometer during import create ~0.1d #import 2026-02-11
- [x] Change visit odometer update to "always newest" (remove only-increase guard) ~0.1d #import 2026-02-11
- [x] Update existing tire's odometer on re-import duplicate ~0.1d #import 2026-02-11
- [x] Fix tire_status endpoint to read per-tire odometer ~0.1d #import 2026-02-11
- [x] Fix tire_changes history to read per-tire odometer ~0.1d #import 2026-02-11
- [x] Fix all_history to read per-tire odometer for tire entries ~0.1d #import 2026-02-11
- [x] Add install_odometer_km to add_visit input schema ~0.05d #import 2026-02-11
- [x] Run Prisma generate ~0.05d #import 2026-02-11
- [x] Update CHANGELOG.md ~0.05d #import 2026-02-11

---

## Fix Excel Import Section-Aware Column Mapping
### Done
- [x] Replace flat COLUMN_MAP with CAR_INFO_MAP + SECTION_COLUMN_MAP + GENERIC_HEADER_SECTIONS ~0.5d #import 2026-02-10
- [x] Add build_column_map() function for per-sheet column resolution ~0.25d #import 2026-02-10
- [x] Refactor on_drop parser with section-aware date/branch/odo routing ~0.5d #import 2026-02-10
- [x] Replace 20-col template with 27-col section-unique template ~0.25d #import 2026-02-10
- [x] Fix template column sort order to match client's Excel layout ~0.1d #import 2026-02-10
- [x] Add oil service note column (บริการน้ำมันเครื่อง) to template + mapping ~0.1d #import 2026-02-10
- [x] Update column reference card with section-grouped display ~0.1d #import 2026-02-10
- [x] Update CHANGELOG.md with fix documentation ~0.05d #import 2026-02-10

---

## Fix Missing i18n Translation Keys
### Done
- [x] Add missing `history` namespace translations (EN + TH) ~0.1d #i18n 2026-02-10
- [x] Add missing `profile` namespace translations (EN + TH) ~0.1d #i18n 2026-02-10
- [x] Add missing `nav` keys (history, user, tire, switch, oil) ~0.1d #i18n 2026-02-10
- [x] Add missing `car` keys (27 keys including registration flow) ~0.2d #i18n 2026-02-10
- [x] Add missing `tire` keys (21 keys for status/details) ~0.2d #i18n 2026-02-10
- [x] Add missing `oil` keys (16 keys for history/details) ~0.1d #i18n 2026-02-10
- [x] Add missing `admin.service_detail` namespace (25 keys) ~0.1d #i18n 2026-02-10
- [x] Add missing `admin.add_service` additional keys (31 keys) ~0.2d #i18n 2026-02-10
- [x] Add missing `auth.otp_send_failed` key ~0.05d #i18n 2026-02-10
- [x] Sync all translations to packages/shared ~0.05d #i18n 2026-02-10
- [x] Update CHANGELOG.md with fix documentation ~0.05d #i18n 2026-02-10

---

## Admin Batch Delete & User Reset Feature
### Done
- [x] Add batch delete API endpoints (batch_delete_cars, batch_delete_visits) ~0.5d #admin 2026-01-30
- [x] Add user management API endpoints (list_users, reset_user) ~0.5d #admin 2026-01-30
- [x] Update admin/cars page with checkbox selection and batch delete ~0.5d #admin 2026-01-30
- [x] Update admin/services page with checkbox selection and batch delete ~0.5d #admin 2026-01-30
- [x] Create admin/users page with reset functionality ~0.5d #admin 2026-01-30
- [x] Add i18n translations (EN/TH) for new features ~0.25d #admin 2026-01-30
- [x] Add users link to admin sidebar ~0.1d #admin 2026-01-30

---

## Project Setup
### Done
- [x] Initialize Next.js 16 with App Router
- [x] Configure MongoDB connection with Prisma
- [x] Set up tRPC with Next.js integration
- [x] Configure next-intl for Thai/English i18n
- [x] Install and configure shadcn/ui
- [x] Set up environment variables structure
- [x] Create monorepo folder structure and base files
- [x] Read PRD.md and BRD.md for requirements
- [x] Create implementation plan

---

## Database Schema (Prisma + MongoDB)
### Done
- [x] Create User model (phone-based identity)
- [x] Create OTPToken model (rate limiting)
- [x] Create Car model (license plate, owner link)
- [x] Create Branch model
- [x] Create ServiceVisit model (header record)
- [x] Create TireChange model (per position: FL/FR/RL/RR)
- [x] Create TireSwitch model (position movement)
- [x] Create OilChange model
- [x] Create AdminUser model (role-based)
- [x] Create ImportBatch model (audit trail)
- [x] ~~Add ApprovalStatus enum~~ (Removed - no approval needed)
- [x] ~~Add approval fields to Car model~~ (Removed - plates work immediately)

---

## Authentication (OTP Flow)
### Done
- [x] Implement OTP generation service
- [x] Implement OTP verification with rate limiting
- [x] Build login page UI (phone input)
- [x] Build OTP verification page UI
- [x] Implement session management

### Todo
- [ ] Create SMS provider integration (abstract) ~0.5d #auth

---

## Mobile-First UI
### Done
- [x] Force light mode only (remove dark mode)
- [x] Create MobileHeader component (simple logo)
- [x] Create BottomNavigation component (Cars | User tabs)
- [x] Create ServiceTabs component (Tire | Tire Switch | Oil)
- [x] Create UserLayout wrapper component
- [x] Update login page with mobile-first design
- [x] Rebrand from TireOff to TireTrack
- [x] Create /user page with UserProfile component
- [x] Create /cars/switch and /cars/oil pages
- [x] Clean UI design ~0.5d #ui 2026-01-17
  - [x] Simplified globals.css (removed gradients/glass effects)
  - [x] Updated MobileHeader with clean white design
  - [x] Updated BottomNavigation with solid colors
  - [x] Updated ServiceTabs with clean tab design
  - [x] Updated PlateList cards with simple borders
  - [x] Updated Button, Input, Card components
  - [x] Updated Login page with clean layout
  - [x] Updated UserProfile with clean cards
  - [x] Updated AddPlateForm with clean design
  - [x] Using Noto Sans Thai font throughout
- [x] Car selection flow for service tabs ~0.5d #ui 2026-01-17
  - [x] Updated CarsProvider with selected_car state, select_car(), clear_selection()
  - [x] Created SelectedCarHeader component (shows selected car with close button)
  - [x] Updated PlateList with on_select callback and selection highlighting
  - [x] Updated CarsLayoutClient to conditionally show ServiceTabs
  - [x] Updated CarsContent to show car list vs service data based on selection
  - [x] Updated /cars, /cars/switch, /cars/oil pages to pass service history components

---

## Customer Features
### Done
- [x] Car list/dashboard page
- [x] Add car modal (license plate validation TH)
- [x] Tire Change History view (timeline)
- [x] Tire Switch History view (separate)
- [x] Oil Change History view
- [x] Add plate page with form (plates work immediately, no approval)
- [x] PlateList component with clean card design
- [x] Tire Status Overview with usage percentage per position ~1d #customer 2026-01-17
  - [x] Added User.name field to Prisma schema
  - [x] Created tire usage calculation utilities
  - [x] Added SERVICE_INTERVALS and TIRE_USAGE_THRESHOLDS constants
  - [x] Created tire_status API endpoint
  - [x] Added i18n translations for tire status and next service
  - [x] Created TireStatusCard with collapsible details
  - [x] Created NextServiceCard component
  - [x] Created TireStatusOverview component
  - [x] Integrated into TireChangeHistory view
- [x] History Tab showing all service logs ~0.5d #customer 2026-01-18
  - [x] Added History tab to BottomNavigation (between Cars and User)
  - [x] Created /history page with unified timeline view
  - [x] Created HistoryList component with color-coded service types
  - [x] Created service.all_history API endpoint
  - [x] Added i18n translations for history namespace (TH/EN)
- [x] Car Info CRUD in Topbar ~0.5d #customer 2026-01-18
  - [x] Created CarInfoSheet component for view/edit/delete car details
  - [x] Added info button in SelectedCarHeader to open CarInfoSheet
  - [x] Enhanced SelectedCarHeader to display model, year, color subtitle
  - [x] Added car.update mutation in car router
  - [x] Updated CarsProvider with update_selected_car function
  - [x] Updated car.list/car.get to return car_year, car_color, car_vin
  - [x] Added update_car_schema validator
  - [x] Added i18n translations for update/remove success/failure (TH/EN)

### Todo
- [ ] Service visit detail view ~0.5d #customer

---

## Admin Portal
### Done
- [x] Admin authentication (hardcoded password) ~0.5d #admin 2026-01-17
- [x] Service records CRUD with data table ~1d #admin 2026-01-17
- [x] Search by plate/phone/branch/date ~0.5d #admin 2026-01-17
- [x] CSV/Excel import with Thai column mapping ~1.5d #admin 2026-01-17
- [x] Branch management CRUD ~0.5d #admin 2026-01-17
- [x] Orange theme + Noto Sans Thai font ~0.25d #admin 2026-01-17
- [x] Makefile for dev commands ~0.25d #admin 2026-01-17
- [x] ~~Plate approval page~~ (Removed - no approval needed)
- [x] ~~Pending plates count on dashboard~~ (Removed - no approval needed)
- [x] Enhanced import deduplication logic ~0.5d #admin 2026-01-18
  - [x] Normalize dates for comparison (strip time component)
  - [x] Detect duplicate service visits for same car + date
  - [x] Check duplicate tire changes by position + tire_size + brand
  - [x] Check duplicate oil changes by viscosity + oil_model
  - [x] Add tire/oil data to existing visits instead of creating duplicates
  - [x] Add duplicate_count to import results
  - [x] Update import UI with 3-column result grid (success, duplicates, errors)

### Todo
- [ ] Import batch audit log UI ~0.5d #admin 2026-01-25

---

## Non-Functional
### Done
- [x] Performance optimization ~0.5d #nfr 2026-01-17
  - [x] Created CarsProvider context with tRPC caching
  - [x] Created cars/layout.tsx with shared provider
  - [x] Created PlateListSkeleton for loading states
  - [x] Memoized ServiceTabs and BottomNavigation with React.memo
  - [x] Added prefetch={true} to navigation links

### Todo
- [ ] Implement proper error handling ~0.5d #nfr 2026-01-26
- [ ] Add logging (frontend + backend) ~0.5d #nfr 2026-01-26
- [ ] Phone number masking in UI ~0.25d #nfr 2026-01-26
- [ ] Mobile responsiveness testing ~0.5d #nfr 2026-01-26
