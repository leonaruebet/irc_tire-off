# Changelog

All notable changes to the TireOff Tire Age Tracking System will be documented in this file.

## [Unreleased]

### 2026-02-10 - Fix: Excel Import Template + Multi-Sheet + Year Conversion

#### Root Cause
1. **Missing tire switch sheet**: Template had tire change and oil change columns but no dedicated tire switch section. Users had to know to use the "บริการ" column implicitly.
2. **Missing oil interval column**: `"ระยะเปลี่ยนถ่าย (กม.)"` was in COLUMN_MAP and backend schema but missing from template.
3. **Single-sheet import**: Importer only read `workbook.SheetNames[0]`, so multi-sheet templates couldn't work.
4. **2-digit year BE/CE mismatch**: 2-digit year "67" (Thai BE 2567 = CE 2024) was incorrectly converted to 1967 instead of 2024. The logic `year >= 50 → +1900` is wrong for Thai context.
5. **Fallback date path**: ISO-format BE dates (e.g., "2567-01-15") in fallback parsing were not checked for BE conversion.
6. **oil_price not converted**: Missing from client-side number conversion array.

#### Fixed
- **Multi-sheet template**: Replaced single-sheet `TEMPLATE_HEADERS` with `TEMPLATE_SHEETS` array containing 3 sheets:
  - "เปลี่ยนยาง" (Tire Change) — car info + tire-change-specific date/branch/odometer + tire fields
  - "สลับยาง" (Tire Switch) — car info + tire-switch-specific date/branch/odometer + service note
  - "เปลี่ยนน้ำมัน" (Oil Change) — car info + oil-change-specific date/branch/odometer + oil fields
- **Multi-sheet import**: Updated `on_drop()` to iterate ALL sheets in workbook, processing each with its own headers and carry-forward state
- **2-digit year fix**: Changed `year >= 50 → +1900` to `year >= 50 → +1957` (BE short form: 67 + 2500 = 2567, minus 543 = 2024, equivalent to +1957)
- **Fallback BE check**: Added `getFullYear() > 2400` check on fallback `new Date()` result
- **oil_price conversion**: Added to numeric field array

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - Multi-sheet template, multi-sheet import, year conversion fixes

---

### 2026-02-10 - Fix: Missing i18n Translation Keys (EN + TH)

#### Root Cause
- Many translation keys were used in components but not defined in the translation JSON files (en.json / th.json)
- Raw translation key strings (e.g., `profile.title`, `nav.history`, `tire.last_changed`) were displayed in the UI instead of translated text
- Affected both client-side (customer app) and admin-side components

#### Fixed
- **`history` namespace** (7 keys): title, no_records, tire_change, tire_switch, oil_change, km, positions
- **`profile` namespace** (7 keys): account_info, phone_number, registered_plates, plates_count, settings, language, actions, logout_success
- **`nav` keys** (5 keys): history, user, tire, switch, oil
- **`car` keys** (27 keys): select_to_view, car_year/color/vin + placeholders, vehicle_info, update/remove success/failed, register_success/failed, plate_not_registered + message, try_another_plate, view_plates, plate_registered + message, add_another, vehicle_info_subtitle, license_plate_format, optional, register_plate, no_records
- **`tire` keys** (21 keys): no_tire_data, last_changed, time_ago, installed_km/date, branch, show/hide_details, remaining_km, usage_percent, detail_title/no_data/position/brand_model/size/production_week/price_per_tire/installed_date/installed_km/branch
- **`oil` keys** (16 keys): title, no_data, last_change, odometer, km, next_service, approx, or, recommendation_note, view_details, brand_model, change_interval, price, type_synthetic/semi_synthetic/conventional
- **`admin.service_detail` namespace** (25 keys): full service detail dialog translations
- **`admin.add_service` additional keys** (31 keys): form.car_selection/select_existing/enter_new/search_car_placeholder/type_to_search/no_cars_found, tire.position_fl/fr/rl/rr/change, tire_switch section (9 keys), oil.engine_type + engine types + oil types + price
- **`auth` key** (1 key): otp_send_failed

#### Files Modified
- `apps/web/src/i18n/messages/en.json` - Added ~140 missing English translation keys
- `apps/web/src/i18n/messages/th.json` - Added ~140 missing Thai translation keys
- `packages/shared/src/i18n/messages/en.json` - Synced from apps/web
- `packages/shared/src/i18n/messages/th.json` - Synced from apps/web

---

### 2026-01-30 - Fix: Excel Import Inconsistent Odometer Values

#### Root Cause
- **Excel rows with different odometer values for same car+date**: When importing 4 tire rows for the same car on the same date, only the FIRST row's odometer was used. Subsequent rows with different (potentially correct) odometer values were ignored.
- Example: If FL tire row had 22,000 km but FR/RL/RR rows had 22,773 km, all 4 tires would show 22,000 km because the ServiceVisit was created from the first row.

#### Fixed
- **Update odometer to maximum value**: When an existing ServiceVisit is found during import, the odometer is now updated to the higher value if the current row has a larger odometer reading.
- This handles Excel files where tire rows have inconsistent odometer values for the same service date.
- Odometer only increases, so taking the max value is the correct behavior.

#### Files Modified
- `packages/api/src/routers/admin.ts` - Added odometer update logic when finding existing visit

#### Note
- This fix applies to **future imports only**
- For existing incorrect data, re-import the Excel or manually fix via admin portal

---

### 2026-01-30 - Feature: Admin Batch Delete & User Reset

#### Added
- **Batch delete for cars**: Admin can select multiple cars using checkboxes and delete them all at once (soft delete)
- **Batch delete for services**: Admin can select multiple service records and delete them all at once (hard delete)
- **Users admin page**: New admin section to manage users with phone, name, car count, service count display
- **User reset (hard delete)**: Admin can reset a user which permanently deletes the user account, all their cars, and all service history - with clear warning dialog
- **Checkbox UI component**: Added Radix UI based checkbox component for table selections

#### API Endpoints Added
- `admin.batch_delete_cars` - Batch soft delete multiple cars
- `admin.batch_delete_visits` - Batch hard delete multiple service visits and related records
- `admin.list_users` - List all users with car/service counts, pagination, search
- `admin.reset_user` - Hard delete user and all associated data

#### Files Modified
- `packages/api/src/routers/admin.ts` - Added batch delete and user management endpoints
- `apps/web/src/app/admin/layout.tsx` - Added Users nav link
- `apps/web/src/app/admin/users/page.tsx` - New users management page (created)
- `apps/web/src/app/admin/cars/page.tsx` - Added checkbox selection and batch delete
- `apps/web/src/app/admin/services/page.tsx` - Added checkbox selection and batch delete
- `apps/web/src/components/ui/checkbox.tsx` - New Checkbox component (created)
- `packages/shared/src/i18n/messages/en.json` - Added translations for batch delete, users page
- `packages/shared/src/i18n/messages/th.json` - Added Thai translations for batch delete, users page

#### Bug Fixes (Pre-existing TypeScript issues)
- `apps/web/src/components/service/tire_switch_history.tsx` - Fixed JSX syntax error (missing closing div), fixed TypeScript null checks for optional `install_date` field
- `packages/api/src/routers/service.ts` - Fixed TypeScript null checks for optional `install_date` field in tire change comparison

---

### 2026-01-30 - Fix: Excel Import Template Mismatch & Missing Service Note Mapping

#### Root Cause
- **TEMPLATE_HEADERS didn't match actual file structure**: The downloadable template had a different column layout than the business Excel file being used. Template had separate sections for "วันที่เปลื่ยนยาง", "สาขาที่เปลื่ยนยาง", "ระยะที่เปลื่ยนยาง (กม.)" but actual file uses shared "วันที่เข้ารับบริการ", "สาขาที่เข้ารับบริการ", "ระยะที่เข้ารับบริการ" for all service types.
- **Missing "บริการ" column mapping**: Tire switch and other service notes use "บริการ" header, but COLUMN_MAP only had "บริการที่เข้ารับ", causing note data to be lost during parsing.
- **Result**: Tire switch and oil change rows were being dropped because the validation requires `visit_date`, but the date column for those rows wasn't being mapped correctly.

#### Fixed
- **Updated TEMPLATE_HEADERS**: Reorganized to match actual business Excel layout with shared service visit columns used by all service types. New structure: car info → service visit (shared) → tire fields → oil fields → service note.
- **Added "บริการ" mapping**: Added column mapping for "บริการ" → `services_note` to capture tire switch and other service notes correctly.
- **Template now aligns with COLUMN_MAP**: Downloaded template will produce files that parse correctly with all service types captured.

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - Updated TEMPLATE_HEADERS structure, added "บริการ" column mapping

---

### 2026-01-28 - Fix: Seamless Data Flow from Excel Import → Prisma → /cars Display

#### Root Cause
- **TireSwitch records were never created during Excel import**: The `import_records` mutation only created `TireChange` (when tire_position + tire_size exist) and `OilChange` (when oil_model or oil_viscosity exist). For สลับยาง (tire switch) rows, only a `ServiceVisit` with `services_note` was created — no `TireSwitch` DB records. This meant the customer `/cars/switch` tab showed empty for imported data.
- **Prisma schema required positions**: `TireSwitch.from_position` and `TireSwitch.to_position` were required `TirePosition` enum fields, but the Excel doesn't have from/to position data for tire switches.

#### Fixed
- **Made TireSwitch positions optional**: Changed `from_position` and `to_position` to `TirePosition?` in Prisma schema. This allows tire switch records without specific position data (from Excel import).
- **Added TireSwitch creation in import_records**: When a row has `services_note` but no tire/oil specific fields (detected as tire switch), a `TireSwitch` record is now created with the notes. Includes deduplication check against existing tire switches.
- **Updated dedup query**: Import now includes `tire_switches` in the existing visit query and tracking (`added_switch`).
- **Updated zod schemas**: `create_visit` now accepts optional `from_position`/`to_position` for tire switches.
- **Graceful null handling in UI**: Service detail dialog and history list now handle null positions — showing a "Tire Switch" badge + notes when positions are absent, or the from→to arrows when positions are present.

#### Data Flow Summary (Post-Fix)
| Service Type | Excel → DB | DB → /cars | Status |
|---|---|---|---|
| Tire Change | tire_size, brand, model, position → `TireChange` | ✅ All fields returned | ✅ Working |
| Tire Switch | services_note → `TireSwitch` (notes, no positions) | ✅ Shows in switch tab | ✅ Fixed |
| Oil Change | oil_model, viscosity, type → `OilChange` | ✅ All fields returned | ✅ Working |

#### Files Modified
- `packages/db/prisma/schema.prisma` - Made TireSwitch from_position/to_position optional
- `packages/api/src/routers/admin.ts` - Added tire switch import logic, updated zod schemas, added dedup tracking
- `apps/web/src/components/admin/service_detail_dialog.tsx` - Handle null positions gracefully
- `apps/web/src/components/history/history_list.tsx` - Handle null positions, show notes fallback
- `apps/web/src/i18n/messages/en.json` - Added tire_switch_service key
- `apps/web/src/i18n/messages/th.json` - Added tire_switch_service key

---

### 2026-01-28 - Admin Services: Add Service Type Filter (บริการ)

#### Feature
- **Service type filter on /admin/services**: Added filter buttons to filter service visits by type:
  - ทั้งหมด (All) — default, no filter
  - เปลี่ยนยาง (Tire Change, blue) — visits with at least one tire change record
  - สลับยาง (Tire Switch, green) — visits with at least one tire switch record
  - เปลี่ยนน้ำมัน (Oil Change, amber) — visits with at least one oil change record
- Filters combine with existing text search (plate/phone)
- Selecting a filter resets pagination to page 1

#### Implementation
- **Backend**: Added `service_type` optional enum param to `list_visits` procedure. Uses Prisma `{ some: {} }` relation filter to check for related records.
- **Frontend**: Added color-coded filter buttons below the search bar. State resets page on filter change.
- **i18n**: Added `filter.*` translation keys to all 4 i18n files (apps/web + packages/shared, TH + EN).

#### Files Modified
- `packages/api/src/routers/admin.ts` - Added service_type filter to list_visits
- `apps/web/src/app/admin/services/page.tsx` - Added service type filter UI
- `apps/web/src/i18n/messages/th.json` - Added filter translations
- `apps/web/src/i18n/messages/en.json` - Added filter translations
- `packages/shared/src/i18n/messages/th.json` - Added filter translations
- `packages/shared/src/i18n/messages/en.json` - Added filter translations

---

### 2026-01-28 - Fix Import: Thai Tire Position → TirePosition Enum Mapping

#### Root Cause
- **8 out of 15 rows failed on import** with `Invalid value for argument 'position'. Expected TirePosition.`
- The Excel uses Thai tire position names ("หน้า-ซ้าย", "หน้า-ขวา", "หลัง-ซ้าย", "หลัง-ขวา") but the Prisma schema expects `TirePosition` enum values (`FL`, `FR`, `RL`, `RR`, `SP`).
- The backend was calling `.toUpperCase()` on Thai text (no effect) then casting `as any` — which Prisma correctly rejected.

#### Fixed
- **Added `TIRE_POSITION_MAP`**: Comprehensive mapping from Thai names, English names, and codes to enum values. Supports hyphenated ("หน้า-ซ้าย") and non-hyphenated ("หน้าซ้าย") Thai forms.
- **Added `normalize_tire_position()` helper**: Safely converts raw position string to enum value with fallback to null + warning log.
- **Updated import_records mutation**: Uses `normalize_tire_position()` instead of raw `.toUpperCase()`. Unknown positions now produce a clear error message instead of a Prisma crash.

#### Files Modified
- `packages/api/src/routers/admin.ts` - Added TIRE_POSITION_MAP, normalize_tire_position(), updated tire change import logic

---

### 2026-01-28 - Admin Import: Preview Split by Service Type + Missing ถ่ายน้ำมัน Column Mappings

#### Root Cause
- **Preview table showed all records in a flat list**: No way to distinguish between tire change, tire switch, and oil change rows in the upload preview. Made it hard to verify data before importing.
- **Missing COLUMN_MAP entries for "ถ่าย" variants**: The real business Excel uses "วันที่ถ่ายน้ำมันเครื่อง" and "สาขาที่ถ่ายน้ำมันเครื่อง" headers (using "ถ่าย" = drain, not "เปลี่ยน" = change). These were not mapped, so oil change rows from some Excel layouts had empty date/branch/odometer.

#### Fixed
- **Service type detection**: Added `detect_service_types()` utility that classifies each parsed row:
  - `tire_change`: row has `tire_size` or `tire_brand` or `tire_model`
  - `oil_change`: row has `oil_model` or `oil_viscosity` or `oil_type`
  - `tire_switch`: row has `services_note` but no tire/oil specific fields
  - Combined rows (e.g., tire + oil on same row) show multiple badges
- **Preview filter tabs**: Added color-coded filter buttons above the preview table:
  - ทั้งหมด (All) | เปลี่ยนยาง (blue) | สลับยาง (green) | เปลี่ยนน้ำมัน (amber)
  - Each tab shows count of matching records
  - Clicking a tab filters the table to only that service type
- **Type column**: New "ประเภท" (Type) column with colored badges per row
- **Note column**: New "หมายเหตุ" (Note) column showing `services_note` value
- **COLUMN_MAP**: Added "ถ่าย" (drain) variants for oil change section:
  - Date: "วันที่ถ่ายน้ำมันเครื่อง", "วันที่ถ่ายน้ำมัน"
  - Branch: "สาขาที่ถ่ายน้ำมันเครื่อง", "สาขาที่ถ่ายน้ำมัน"
  - Odometer: "ระยะถ่ายน้ำมันเครื่อง", "ระยะที่ถ่ายน้ำมันเครื่อง" (with/without กม.)

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - Service type detection, preview filter tabs, type/note columns, COLUMN_MAP expanded
- `apps/web/src/i18n/messages/th.json` - Added filter.* and table.type/note translations
- `apps/web/src/i18n/messages/en.json` - Added filter.* and table.type/note translations
- `packages/shared/src/i18n/messages/th.json` - Added filter.* and table.type/note translations
- `packages/shared/src/i18n/messages/en.json` - Added filter.* and table.type/note translations

---

### 2026-01-27 - Fix Admin Import: Add Missing สลับยาง / เปลี่ยนน้ำมัน Column Mappings

#### Root Cause
- **Tire switch and oil change rows dropped from preview**: The business Excel uses distinct Thai header variants for each service type section:
  - Tire change section: "วันที่เปลื่ยนยาง", "สาขาที่เปลื่ยนยาง", "ระยะที่เปลื่ยนยาง (กม.)"
  - Tire switch section: "วันที่สลับยาง", "สาขาที่สลับยาง", "ระยะสลับยาง"
  - Oil change section: "วันที่เปลี่ยนน้ำมันเครื่อง", "สาขาที่เปลี่ยนน้ำมันเครื่อง", etc.
- The COLUMN_MAP only had entries for "เปลื่ยนยาง" and "เข้ารับบริการ" variants, so date/branch/odometer for switch and oil rows were never mapped → `visit_date` was empty → rows failed required-field validation → silently dropped from preview.
- Column C in real Excel uses "ยี่ห้อรถ" (car brand), not "รถรุ่น" (car model). Missing mapping also caused car_model to be empty for some Excel layouts.

#### Fixed
- **COLUMN_MAP**: Added comprehensive header variants for all 4 section types:
  - Tire switch (สลับยาง): date, branch, odometer variants (with/without กม.)
  - Oil change (เปลี่ยนน้ำมันเครื่อง / เปลี่ยนน้ำมัน / เปลี่ยนถ่าย): date, branch, odometer variants
  - Car model variant: "ยี่ห้อรถ" → car_model
- Multiple headers mapping to same field is safe: left-to-right iteration means last non-empty value wins, which is the correct service-type-specific value for each row.

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - COLUMN_MAP expanded with สลับยาง + เปลี่ยนน้ำมัน variants

---

### 2026-01-27 - Fix Admin Import: Carry-Forward Car Info & Thai Date Parsing

#### Root Cause
- **Missing oil/switch rows**: Business Excel only fills car info (plate, phone) on the first row of a group. Subsequent rows for oil changes or tire switches leave those cells empty, causing them to be filtered out by the required-fields validation.
- **Invalid Date for string dates**: Dates stored as Thai strings (DD/MM/YYYY, Buddhist Era e.g. "1/12/2568") were passed to `new Date()` which can't parse DD/MM/YYYY format, producing Invalid Date.

#### Fixed
- **Carry-forward logic**: If a row has empty license_plate or phone, values are inherited from the previous successfully parsed row (common grouped Excel pattern)
- **`parse_excel_date()` helper**: Handles Excel serial numbers, DD/MM/YYYY strings, Buddhist Era conversion (BE > 2400 → CE = BE - 543), and 2-digit year expansion
- **Stricter date validation**: Rows with Invalid Date are now rejected (previously passed truthy check since Invalid Date is a Date object)
- **Relaxed branch requirement**: Rows without branch_name get a default placeholder instead of being filtered out
- **Empty row skip**: Rows where all cells are empty are properly skipped

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - parse_excel_date(), carry-forward, validation

---

### 2026-01-27 - Fix Admin Import: Realign Template & Add Missing Column Mappings

#### Root Cause
- **Template headers mismatch**: The downloadable Excel template did not match the actual column layout used by the business. Missing headers caused data to be silently dropped during parsing.
- **Missing COLUMN_MAP entries**: Three Thai headers from the real Excel were not mapped:
  - `"ระยะที่เข้ารับบริการ (กม.)"` (odometer with suffix) — odometer values from service sections were ignored
  - `"บริการที่เข้ารับ"` (service note) — service type/notes were dropped
  - `"เครื่องยนต์"` (engine type) — engine type for oil changes was dropped
- **Missing fields in ParsedRecord & backend schema**: `services_note` and `engine_type` had no frontend interface or backend Zod schema entry, so they could never flow from Excel to database.

#### Fixed
- **TEMPLATE_HEADERS**: Realigned to match the business Excel layout with correct column order:
  car info → tire change → service visit (x2) → pricing → oil change
- **COLUMN_MAP**: Added 3 missing Thai header mappings (`ระยะที่เข้ารับบริการ (กม.)`, `บริการที่เข้ารับ`, `เครื่องยนต์`)
- **ParsedRecord interface**: Added `services_note` and `engine_type` optional fields
- **Backend import schema**: Added `services_note` and `engine_type` to Zod validation
- **Backend import logic**: Now passes `services_note` to ServiceVisit creation and `engine_type` to OilChange creation

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - Template headers, COLUMN_MAP, ParsedRecord
- `packages/api/src/routers/admin.ts` - Import schema & mutation logic

---

### 2026-01-26 - Fix Admin Import: Excel Type Coercion for Phone & Odometer

#### Root Cause
- **Phone field**: Excel stores phone numbers as numeric values, stripping the leading zero (e.g., `0812345678` → `812345678`). The Zod schema expected `z.string()` but received a number, causing `invalid_type` errors for every record.
- **odometer_km field**: When the Excel cell is empty, the field is never set on the parsed record. The Zod schema required `z.number()` (not optional), causing `Required` validation errors.

#### Fixed
- **Frontend parsing (page.tsx)**: Added phone-to-string coercion during Excel row parsing
  - Converts numeric phone values to strings via `String(value)`
  - Restores leading zero for 9-digit Thai phone numbers (`/^\d{9}$/` → `"0" + value`)
  - Also coerces `license_plate`, `tire_production_week`, `tire_size` from number to string
- **Backend schema (admin.ts)**: Made all import fields defensively coercible
  - `phone`: Changed from `z.string()` to `z.coerce.string().transform()` with leading zero restoration
  - `odometer_km`: Changed from `z.number()` to `z.coerce.number().optional().default(0)`
  - All string fields: Changed from `z.string()` to `z.coerce.string()` for Excel numeric safety
  - All number fields: Changed from `z.number()` to `z.coerce.number()` for string-to-number safety
- **ParsedRecord interface**: Made `odometer_km` optional to match rows with empty odometer cells

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - Phone coercion, string coercion, optional odometer_km
- `packages/api/src/routers/admin.ts` - Defensive z.coerce for all import_records schema fields

---

### 2026-01-26 - Admin Import: Download Template Button

#### Added
- **Download Template Button**: Admin import page now has a "Download Template" button
  - Generates an `.xlsx` file client-side with all correct Thai column headers
  - Headers match `COLUMN_MAP` exactly so imported files parse correctly
  - Uses deduplicated headers (one per field, general service variants preferred)
  - Column widths set for readability
  - Button placed above the drag-and-drop upload area with description text
  - Uses `Download` icon from lucide-react

#### i18n Translations Added
- `admin.import_page.download_template`: "ดาวน์โหลดเทมเพลต" / "Download Template"
- `admin.import_page.download_template_desc`: Description text (TH/EN)

#### Files Modified
- `apps/web/src/app/admin/import/page.tsx` - Added TEMPLATE_HEADERS, download_template(), Download button UI
- `apps/web/src/i18n/messages/th.json` - Added download_template translations
- `apps/web/src/i18n/messages/en.json` - Added download_template translations
- `packages/shared/src/i18n/messages/th.json` - Added download_template translations
- `packages/shared/src/i18n/messages/en.json` - Added download_template translations

---

### 2026-01-26 - Fix ThaiBulkSMS OTP Integration (v2 API Migration)

#### Root Cause
- ThaiBulkSMS OTP API had 3 critical integration bugs causing HTTP 423 "Gateway response send sms fail":
  1. Wrong API version: code used `/v1/otp/` but API requires `/v2/otp/`
  2. Wrong Content-Type: code sent `application/json` but API expects `application/x-www-form-urlencoded`
  3. Missing `+` prefix on phone number: docs require `+66xxxxxxxxx` format
- Additionally, code was sending `pin` parameter in OTP request, but ThaiBulkSMS generates its own OTP — `pin` is only used at the `/verify` step
- Verify function referenced undefined `nested_data` variable in error return

#### Fixed
- **sms.ts**: Migrated from v1 to v2 API endpoints (`https://otp.thaibulksms.com/v2/otp/request` and `/verify`)
- **sms.ts**: Changed Content-Type from `application/json` to `application/x-www-form-urlencoded` with `URLSearchParams`
- **sms.ts**: Added `+` prefix to phone number (`+66xxxxxxxxx`)
- **sms.ts**: Removed `pin` from OTP request body (ThaiBulkSMS generates its own OTP)
- **sms.ts**: Fixed verify function error return to use computed `error_message` instead of undefined `nested_data`
- **sms.ts**: Updated response parsing to handle v2 response format

#### Files Modified
- `packages/shared/src/utils/sms.ts` - Full v2 API migration (request + verify endpoints, format, phone prefix, response parsing)

---

### 2026-01-26 - Fix Silent OTP SMS Delivery Failure

#### Root Cause
- When ThaiBulkSMS API failed to deliver OTP (e.g., insufficient credits, invalid phone, API error), the backend silently swallowed the error and returned `success: true` to the client
- The user saw "OTP sent" but never received the SMS
- The frontend `onSuccess` handler only checked for `data.success === true` and `data.cooldown_seconds`, ignoring the `success: false` + `error` case

#### Fixed
- **auth.ts `request_otp`**: Now returns `{ success: false, error: "SMS_SEND_FAILED: ..." }` when SMS delivery fails, instead of silently continuing
- **LoginForm**: Added `data.error` handling in `onSuccess` to show a toast with the SMS failure message
- User now sees "ไม่สามารถส่ง OTP ได้" / "Failed to send OTP" toast when SMS delivery fails

#### i18n Translations Added
- `auth.otp_send_failed`: "ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่" / "Failed to send OTP. Please try again."

#### Files Modified
- `packages/api/src/routers/auth.ts` - Return SMS failure to client instead of swallowing
- `apps/web/src/components/auth/login_form.tsx` - Handle SMS failure in onSuccess callback
- `apps/web/src/i18n/messages/th.json` - Added otp_send_failed translation
- `apps/web/src/i18n/messages/en.json` - Added otp_send_failed translation

#### Next Steps to Investigate
- Check ThaiBulkSMS dashboard for account balance/credits
- Check ThaiBulkSMS API logs for error responses
- Verify SMS_API_KEY and SMS_API_SECRET are still valid

---

### 2026-01-26 - Add Edit/Delete Car Actions to Car List

#### Added
- **PlateCard 3-dot DropdownMenu**: Each car card in the list now has a MoreVertical (3-dot) menu
  - "Edit" option (Pencil icon) opens CarInfoSheet dialog for that car
  - "Delete" option (Trash2 icon, red text) opens delete confirmation AlertDialog
  - Menu click stops event propagation so it doesn't trigger car selection
  - Uses existing i18n translations (`common.edit`, `common.delete`)

#### Changed
- **PlateList Component**: Added `on_edit` and `on_delete` callback props
  - Passes handlers down to each PlateCard
  - PlateCard renders DropdownMenu when either handler is provided
- **CarsContent Component**: Now manages edit/delete state from the car list
  - `editing_car` state: opens CarInfoSheet dialog when set
  - `deleting_car` state: opens AlertDialog for delete confirmation
  - Uses `trpc.car.remove` mutation for deletion with toast notifications
  - Refetches car list on successful delete

#### UX Flow
- Car list view: Each card shows license plate, model info, and a 3-dot menu
- Click card body: Still selects the car (opens service history) — unchanged
- Click 3-dot menu → Edit: Opens CarInfoSheet dialog for that car
- Click 3-dot menu → Delete: Opens delete confirmation dialog
- SelectedCarHeader info button: Still works as before (no regression)

#### Files Modified
- `apps/web/src/components/cars/plate_list.tsx` - Added DropdownMenu with Edit/Delete actions
- `apps/web/src/components/cars/cars_content.tsx` - Added edit/delete state management and dialogs

---

### 2026-01-26 - Validate License Plate Against Admin-Registered Cars

#### Changed
- **car.add Mutation**: Users can no longer self-register new license plates
  - Plate must be pre-registered by admin (via admin portal or Excel import) before a user can add it
  - If the plate doesn't exist in the system, throws `NOT_FOUND` error with `PLATE_NOT_REGISTERED` message
  - Existing behavior preserved: soft-deleted cars can still be restored, conflicts for same/other user still work

#### Added
- **AddPlateForm "Not Registered" State**: New UI state when plate is not found in admin system
  - Shows amber warning icon with "ไม่พบทะเบียนในระบบ" / "Plate Not Registered" heading
  - Displays the entered license plate number
  - Shows message to contact the branch for registration
  - Buttons: "ลองทะเบียนอื่น" (try another) and "ดูรายการรถ" (view plates)

#### i18n Translations Added
- `car.plate_not_registered`: "ไม่พบทะเบียนในระบบ" / "Plate Not Registered"
- `car.plate_not_registered_message`: Contact branch message (TH/EN)
- `car.try_another_plate`: "ลองทะเบียนอื่น" / "Try Another Plate"

#### Files Modified
- `packages/api/src/routers/car.ts` - Replaced car creation with NOT_FOUND error for unregistered plates
- `apps/web/src/components/cars/add_plate_form.tsx` - Added not-registered UI state and error handling
- `apps/web/src/i18n/messages/th.json` - Added plate_not_registered translations
- `apps/web/src/i18n/messages/en.json` - Added plate_not_registered translations

---

### 2026-01-26 - SEO Backlinks to iReadCustomer.com (5 Methods)

#### Added
- **Method 1 - Hidden Anchor**: Off-screen `<a>` tag in body (`left: -9999px`, `aria-hidden`, `tabIndex=-1`)
- **Method 2 - JSON-LD Structured Data**: `schema.org/WebApplication` with `creator` and `developer` referencing iReadCustomer organization
- **Method 3 - `<link>` Tags in `<head>`**: `rel="author"` and `rel="publisher"` pointing to `https://ireadcustomer.com`
- **Method 4 - HTTP Link Header**: Vercel response header `Link: <https://ireadcustomer.com>; rel="author"` on all routes
- **Method 5 - Meta Tags**: `authors`, `creator`, `publisher` in Next.js Metadata object
- **Method 6 - Subtle Footer Credit**: Tiny "Powered by iReadCustomer" text at page bottom (10px, light grey `#ccc`)

#### Files Modified
- `apps/web/src/app/layout.tsx` - Added hidden anchor, `<head>` link tags, JSON-LD script, meta fields, footer credit
- `apps/web/vercel.json` - Added HTTP `Link` header to all routes

---

### 2026-01-26 - Enforce Real OTP in Production

#### Changed
- **OTP Verification**: Bypass code "000000" now only works in non-production environments
  - Re-added `NODE_ENV !== "production"` guard to bypass code check
  - In production, users must enter the real OTP sent via ThaiBulkSMS SMS
  - Development/local environments still allow "000000" for testing convenience
  - Updated log message to include environment context

#### Files Modified
- `packages/api/src/routers/auth.ts` - Added production guard to bypass code logic

---

### 2026-01-25 - Oil Tab Layout Redesign

#### Changed
- **OilChangeHistory Component**: Restructured oil tab layout to match new design spec
  - Title: Brand name + (viscosity) as main heading (e.g., "SHELL HELIX ULTRA (10W-40)")
  - Type: Shows oil type below title (e.g., "ประเภท: สังเคราะห์แท้")
  - Last changed date with Thai format (e.g., "เปลี่ยนล่าสุด : 25 มกราคม 2568")
  - Odometer at change (e.g., "เลขไมล์ตอนเปลี่ยน: 52,300 กม.")
  - Next service recommendation section with orange header
  - Collapsible details section with "[ ดูรายละเอียดน้ำมันเครื่อง ]" toggle
  - Details include: Brand/Model, Viscosity, Engine Type, Change Interval, Price

#### Added
- **i18n Translations**: Added new oil translation keys
  - `oil.brand_model`: "ยี่ห้อ/รุ่น" / "Brand/Model"
  - `oil.view_details`: "ดูรายละเอียดน้ำมันเครื่อง" / "View oil details"
  - `oil.change_interval`: "ระยะเปลี่ยนถ่าย" / "Change Interval"
  - `oil.recommendation_note`: "แนะนำตรวจเช็คทุก {km} กม. หรือ 6 เดือน"
  - Updated `oil.odometer` to "เลขไมล์ตอนเปลี่ยน" for clearer meaning
  - Updated `oil.engine_type` to "ประเภทเครื่องยนต์" for consistency

#### Files Modified
- `apps/web/src/components/service/oil_change_history.tsx` - Complete layout restructure
- `apps/web/src/i18n/messages/th.json` - Added/updated oil translations
- `apps/web/src/i18n/messages/en.json` - Added/updated oil translations

---

### 2026-01-25 - Show Last Tire Change Info on Tire Cards

#### Changed
- **TireInfoCard Component**: Now displays last tire change info directly on each tire card (FL, FR, RL, RR)
  - **Clear position labels**: Shows English position prominently (FRONT LEFT, FRONT RIGHT, REAR LEFT, REAR RIGHT)
  - Thai position name shown below in smaller text (หน้าซ้าย, หน้าขวา, หลังซ้าย, หลังขวา)
  - Shows "เปลี่ยนล่าสุด :" with date in Thai Buddhist calendar format (e.g., "25 มกราคม 2567")
  - Shows duration since tire change using human-readable format (e.g., "ผ่านมาแล้ว 2 ปี" or "2 years ago")
  - Shows "เลขไมล์ :" with odometer reading at tire install (e.g., "22,773")
  - Data displayed in same format as tire size (ขนาดยาง : 205/55R16)
  - No need to click "ดูรายละเอียด" to see this info

#### Added
- **i18n Translation**: Added `tire.time_ago` translation ("ผ่านมาแล้ว" / "ago")
  - Handles word order difference between Thai and English

#### Files Modified
- `apps/web/src/components/service/tire_info_list.tsx` - Display last changed date and odometer on each tire card
- `apps/web/src/i18n/messages/th.json` - Added tire.time_ago translation
- `apps/web/src/i18n/messages/en.json` - Added tire.time_ago translation

---

### 2026-01-24 - Tire Age Display in Human-Readable Duration Format

#### Changed
- **TireCardCompact Component**: Changed tire age display from raw days (e.g., "730 วัน") to human-readable duration format
  - Now shows "1 ปี 3 เดือน" (TH) or "1 year 3 months" (EN) instead of "730 วัน"
  - Uses locale-aware formatting (Thai/English)
  - Shows only significant parts: years+months if years>0, months only if <1 year, days only if <1 month

#### Added
- **format_days_as_duration() Utility**: New shared utility function for converting days to human-readable duration
  - Parameters: `total_days` (number), `locale` ('th' | 'en')
  - Returns formatted string like "1 ปี 3 เดือน" or "1 year 3 months"
  - Smart formatting: omits zero-value components for cleaner display
- **get_duration_parts() Utility**: Helper function to decompose days into years, months, days
  - Returns `DurationParts` interface with `{ years, months, days }`
- **DurationParts Interface**: Type definition for duration components

#### Files Modified
- `packages/shared/src/utils/index.ts` - Added format_days_as_duration(), get_duration_parts(), DurationParts
- `apps/web/src/components/service/tire_status_visual.tsx` - Updated TireCardCompact to use duration format

---

### 2026-01-24 - Default Language Changed to Thai & i18n Fixes

#### Changed
- **i18n Default Locale**: Thai (th) is now the true default language
  - Removed accept-language header detection that was overriding the default
  - Previously, browsers with "en" in accept-language would see English
  - Now Thai is always the default unless user explicitly switches via UI
  - Users can still change language in settings, which sets a cookie

#### Fixed
- **CarsContent Component**: Replaced hardcoded strings with i18n translations
  - "My Cars" → `car.title`
  - "Select a car to view service history" → `car.select_to_view`
  - "Add" → `common.add`

#### i18n Translations Added
- `car.select_to_view`: "เลือกรถเพื่อดูประวัติการบริการ" (TH) / "Select a car to view service history" (EN)

#### Files Modified
- `apps/web/src/i18n/request.ts` - Removed accept-language fallback logic
- `apps/web/src/components/cars/cars_content.tsx` - Added i18n support
- `apps/web/src/i18n/messages/th.json` - Added car.select_to_view
- `apps/web/src/i18n/messages/en.json` - Added car.select_to_view

---

### 2026-01-24 - Tire Detail Dialog Feature

#### Added
- **TireDetailDialog Component**: New modal dialog for viewing detailed tire information
  - Shows position badge (หน้าซ้าย FL, หน้าขวา FR, หลังซ้าย RL, หลังขวา RR)
  - Shows tire brand, model, and size (e.g., 235/50R18)
  - Shows production week (สัปดาห์ผลิต: 1225)
  - Shows price per tire (ราคาต่อเส้น: 2,760 บาท)
  - Shows last changed date (เปลี่ยนล่าสุด: 25 มกราคม 2567)
  - Shows days ago in year/month/day format (e.g., "2 ปี 1 เดือน" or "3 year 2 month")
  - Shows odometer at install (เลขไมล์: 22,773)
  - Shows branch name (สาขา: TireTrack สาขากรุงเทพ)
  - Skeleton loading state while fetching data
  - Uses i18n translations for Thai/English support
  - Icons for visual clarity (Disc3, Calendar, Gauge, MapPin, CircleDollarSign)

#### Changed
- **TireStatusOverview Component**: Added dialog state management
  - Added `detail_position` state for controlling which tire detail to show
  - Added `set_detail_position` function for opening dialog
  - Passes `on_view_details` callback to TireInfoList to open dialog
  - Includes TireDetailDialog component in render

- **TireInfoList Component**: Simplified card display - only shows tire size by default
  - Card now shows ONLY: position header and tire size (ขนาดยาง : 205/55R16)
  - Removed from card: brand, price, install date, odometer, branch
  - All details now shown in the detail dialog when clicking "[ ดูรายละเอียด ]"
  - Cleaner, more focused card design

#### i18n Translations Added
- `tire.detail_title`: "รายละเอียดยาง" (Tire Details)
- `tire.detail_position`: "ตำแหน่ง" (Position)
- `tire.detail_brand_model`: "ยี่ห้อและรุ่นยาง" (Brand and Model)
- `tire.detail_size`: "ขนาดยาง" (Tire Size)
- `tire.detail_production_week`: "สัปดาห์ผลิต" (Production Week)
- `tire.detail_price_per_tire`: "ราคาต่อเส้น" (Price Per Tire)
- `tire.detail_installed_date`: "เปลี่ยนล่าสุด" (Last Changed)
- `tire.detail_installed_km`: "เลขไมล์" (Odometer)
- `tire.detail_branch`: "สาขา" (Branch)
- `tire.detail_no_data`: "ไม่พบข้อมูลยาง" (No tire data found)

#### Files Created
- `apps/web/src/components/service/tire_detail_dialog.tsx` - Tire detail modal component

#### Files Modified
- `apps/web/src/components/service/tire_status_overview.tsx` - Added dialog state management
- `apps/web/src/i18n/messages/th.json` - Added tire detail translations
- `apps/web/src/i18n/messages/en.json` - Added tire detail translations

---

### 2026-01-24 - App Name Changed to ทรัพย์ไพศาล

#### Changed
- **App Branding**: Changed app name from "TireTrack/TireOff" to "ทรัพย์ไพศาล" throughout the application
  - Updated page metadata title and apple web app title in `layout.tsx`
  - Updated mobile header text in `mobile_header.tsx`
  - Updated user header text in `user_header.tsx`
  - Updated login page title and footer in `login/page.tsx`
  - Updated i18n `common.app_name` in all locale files (TH/EN)
  - Updated i18n `admin.tiretrack_admin` in all locale files
  - Updated i18n `admin.login_page.sign_in_subtitle` in all locale files
  - Updated SMS sender ID in `sms.ts`
  - Updated `.env.example` SMS_SENDER_ID and NEXT_PUBLIC_APP_NAME

#### Files Modified
- `apps/web/src/app/layout.tsx` - Updated metadata title
- `apps/web/src/app/login/page.tsx` - Updated login page branding
- `apps/web/src/components/layout/mobile_header.tsx` - Updated header text
- `apps/web/src/components/layout/user_header.tsx` - Updated header text
- `apps/web/src/i18n/messages/th.json` - Updated app_name and admin translations
- `apps/web/src/i18n/messages/en.json` - Updated app_name and admin translations
- `packages/shared/src/i18n/messages/th.json` - Updated app_name and admin translations
- `packages/shared/src/i18n/messages/en.json` - Updated app_name and admin translations
- `packages/shared/src/utils/sms.ts` - Updated SMS sender ID
- `.env.example` - Updated SMS_SENDER_ID and NEXT_PUBLIC_APP_NAME

---

### 2026-01-24 - OTP Bypass Code (000000) Works in All Environments

#### Changed
- **OTP Verification**: Bypass code "000000" now works in all environments (dev + production)
  - Removed `NODE_ENV !== "production"` check
  - Useful for testing and support scenarios
  - Auto-creates user if not exists when using bypass code
  - Renamed variable from `is_dev_bypass` to `is_bypass_code` for clarity

#### Files Modified
- `packages/api/src/routers/auth.ts` - Updated bypass code logic to work in all environments

---

### 2026-01-24 - Admin Service Detail Modal

#### Added
- **ServiceDetailDialog Component**: New modal dialog for viewing service visit details
  - Shows car info (license plate, model, owner phone/name)
  - Shows visit info (date, branch, odometer, total price, notes)
  - Shows tire changes with position badges, brand, model, size, production week, price
  - Shows tire switches with from/to position badges and notes
  - Shows oil changes with model, viscosity, oil type, engine type, interval, price
  - Skeleton loading state while fetching data
  - Uses i18n translations for Thai/English support

#### Changed
- **Admin Services Page**: Eye icon now opens detail modal instead of navigating to `/admin/services/[id]`
  - Removed unused router import
  - Added `detail_visit_id` state for controlling modal
  - Added `ServiceDetailDialog` component

#### i18n Translations Added
- `admin.service_detail.*` namespace with all detail dialog translations
- Thai: title, car_info, visit_info, tire_changes, tire_switches, oil_changes, etc.
- English: corresponding translations

#### Files Created
- `apps/web/src/components/admin/service_detail_dialog.tsx` - Service detail modal component

#### Files Modified
- `apps/web/src/app/admin/services/page.tsx` - Use modal instead of navigation
- `apps/web/src/i18n/messages/th.json` - Added admin.service_detail namespace
- `apps/web/src/i18n/messages/en.json` - Added admin.service_detail namespace

---

### 2026-01-24 - Excel Data Parity: Admin UI & User Display Enhancements

#### Added
- **Admin AddServiceDialog - Oil Change Fields**:
  - `engine_type` dropdown (เบนซิน, ดีเซล, ไฮบริด, ไฟฟ้า)
  - `oil_type` dropdown (สังเคราะห์แท้, กึ่งสังเคราะห์, ธรรมดา)
  - `price` input field for oil change cost
- **Admin AddServiceDialog - Tire Switch Recording**:
  - Checkbox to enable tire switch/rotation recording
  - Notes field for service details (e.g., สลับยาง-ถ่วงล้อ)
  - Stores same data as Excel import (tire_switches table)

#### Changed
- **TireInfoList (User Display)**: Now shows all Excel fields
  - Production week: `(สัปดาห์ผลิต: 1225)` appended to brand/model
  - Price per tire: `ราคาต่อเส้น: 5,200 บาท`
  - Branch name: `สาขา: ทรัพย์ไพศาลวีลส์ บางแค`
- **OilChangeHistory (User Display)**: Now shows all Excel fields
  - Engine type: `เครื่องยนต์: เบนซิน`
  - Price: `ราคา: 1,800 บาท`

#### i18n Translations Added
- `admin.add_service.oil.engine_type`, `engine_type_placeholder`
- `admin.add_service.oil.engine_gasoline`, `engine_diesel`, `engine_hybrid`, `engine_electric`
- `admin.add_service.oil.type_synthetic`, `type_semi_synthetic`, `type_conventional`
- `admin.add_service.oil.price`, `price_placeholder`
- `admin.add_service.tire_switch.*` (title, description, notes, notes_placeholder)
- `oil.price` for user display

#### Data Flow (Excel Import ↔ UI Form)
Both methods now store identical data:
| Field | Excel Column | UI Form | Database |
|-------|-------------|---------|----------|
| Engine type | เครื่องยนต์ | Dropdown | OilChange.engine_type |
| Oil type | ประเภทน้ำมันเครื่อง | Dropdown | OilChange.oil_type |
| Oil price | ราคาทั้งหมด | Input | OilChange.price |
| Tire switch | บริการที่เข้ารับ | Checkbox+Notes | TireSwitch |
| Production week | สัปดาห์ผลิต | Input | TireChange.production_week |

#### Files Modified
- `apps/web/src/components/admin/add_service_dialog.tsx` - Added oil/tire_switch fields
- `apps/web/src/components/service/tire_info_list.tsx` - Display production_week, price, branch
- `apps/web/src/components/service/oil_change_history.tsx` - Display engine_type, price
- `apps/web/src/i18n/messages/en.json` - Added translations
- `apps/web/src/i18n/messages/th.json` - Added translations

---

### 2026-01-24 - Admin Cars Management & Service Dialog Car Selection

#### Added
- **Admin Cars Page** (`/admin/cars`): New page for managing cars in admin portal
  - Full CRUD operations (create, read, update, delete)
  - Search by license plate, phone, or owner name with plate normalization
  - Pagination with 20 items per page
  - Table view with license plate, owner phone, owner name, car model, service count
  - Add/Edit dialog with all car fields (plate, phone, owner name, model, year, color, VIN)
  - Delete confirmation dialog with soft delete
  - Responsive design from the start
  - Full i18n support (Thai/English)

- **AddServiceDialog Car Selection**: Admin can now select existing cars when adding service records
  - Toggle between "Select Existing" and "Enter New" modes
  - Car search with Command/Popover components
  - Search by plate, phone, or owner name (minimum 2 characters)
  - Selected car display with plate, phone, owner name, and model
  - Clear selection button to start fresh
  - Form auto-fills when car is selected

- **Admin Car API Endpoints** in `packages/api/src/routers/admin.ts`:
  - `admin.list_cars`: Paginated list with search support
  - `admin.get_car`: Get single car by ID
  - `admin.create_car`: Create new car (or restore if soft-deleted)
  - `admin.update_car`: Update car details
  - `admin.delete_car`: Soft delete car
  - `admin.search_cars`: Simplified search for dropdown selection

- **i18n Translations**: Added comprehensive translations for both features
  - `admin.cars`: Navigation label
  - `admin.cars_page.*`: All cars page translations
  - `admin.add_service.form.*`: Car selection translations
  - Thai and English support

#### Changed
- **Admin Layout**: Added "Cars" navigation item with Car icon
- **AddServiceDialog**: Rewrote to support car selection workflow
  - Car must be selected or entered before submitting
  - Submit button disabled until car is selected in "Select Existing" mode

#### Files Modified
- `apps/web/src/app/admin/layout.tsx` - Added cars nav item
- `apps/web/src/app/admin/cars/page.tsx` - New admin cars page
- `apps/web/src/components/admin/add_service_dialog.tsx` - Car selection feature
- `apps/web/src/i18n/messages/en.json` - Added admin cars and service translations
- `apps/web/src/i18n/messages/th.json` - Added admin cars and service translations
- `packages/api/src/routers/admin.ts` - Added car management endpoints

---

### 2026-01-24 - Admin Portal Responsive Design

#### Changed
- **Admin Dashboard**: Recent visits now stack vertically on mobile
- **Admin Services Page**:
  - Pagination controls now stack on mobile (`flex-col sm:flex-row`)
  - Page info text centered on mobile
- **Admin Branches Page**:
  - Header buttons now stack on mobile
  - Added `overflow-x-auto` wrapper for table horizontal scrolling
  - Add button now full-width on mobile
- **Admin Import Page**:
  - File preview header buttons stack on mobile
  - Import result stats grid: `grid-cols-1 sm:grid-cols-3`
  - Preview table has min-width for proper horizontal scroll
- **AddServiceDialog**:
  - Basic info form: `grid-cols-1 sm:grid-cols-2`
  - Tire details grid: `grid-cols-1 sm:grid-cols-3`
  - Oil change grid: `grid-cols-1 sm:grid-cols-2`
  - Dialog width: `w-[95vw] max-w-2xl` for mobile
  - Submit buttons stack vertically on mobile (`flex-col-reverse sm:flex-row`)

#### Files Modified
- `apps/web/src/app/admin/page.tsx` - Dashboard recent visits responsive
- `apps/web/src/app/admin/services/page.tsx` - Pagination responsive
- `apps/web/src/app/admin/branches/page.tsx` - Header and table responsive
- `apps/web/src/app/admin/import/page.tsx` - Preview and results responsive
- `apps/web/src/components/admin/add_service_dialog.tsx` - Form grids responsive

---

### 2026-01-24 - Admin Portal i18n Support

#### Added
- **Admin Login Page i18n**: Full Thai/English translation support
  - Added `admin.login_page` namespace with all login form translations
  - Translations for: admin_portal, sign_in, credentials, username, password, login messages
  - Customer portal link text translated
- **Admin Import Page i18n**: Full Thai/English translation support
  - Connected existing `admin.import_page` translations to the component
  - All upload, preview, and result messages now translated
  - Added missing `duplicates_skipped` and `duplicates_note` to Thai translations
- **AddServiceDialog i18n**: Full Thai/English translation support
  - Connected existing `admin.add_service` translations to the component
  - Form labels, placeholders, tire/oil sections, and buttons all translated

#### Changed
- **`/admin/login/page.tsx`**: Replaced all hardcoded strings with i18n translations
  - Uses `useTranslations("admin.login_page")`
  - Zod validation messages now translated
  - Toast messages now translated
- **`/admin/import/page.tsx`**: Replaced all hardcoded strings with i18n translations
  - Uses `useTranslations("admin.import_page")`
  - Toast messages now translated
  - Table headers and result labels now translated
- **`/components/admin/add_service_dialog.tsx`**: Replaced all hardcoded strings with i18n translations
  - Uses `useTranslations("admin.add_service")`
  - Form fields, tire section, oil section, and buttons now translated

#### Files Modified
- `packages/shared/src/i18n/messages/th.json` - Added admin.login_page namespace, added duplicates translations
- `packages/shared/src/i18n/messages/en.json` - Added admin.login_page namespace
- `apps/web/src/app/admin/login/page.tsx` - Added i18n support
- `apps/web/src/app/admin/import/page.tsx` - Added i18n support
- `apps/web/src/components/admin/add_service_dialog.tsx` - Added i18n support

---

### 2026-01-24 - License Plate Search Normalization & User Car CRUD

#### Added
- **`normalize_plate_for_search()` utility**: New function in shared utils for normalizing license plate search queries
  - Converts dashes to spaces for consistent matching
  - Returns both normalized and stripped versions for flexible matching
  - Ensures "กข-1234", "กข 1234", and "กข1234" all find the same car

- **User-side car search**: Added search parameter to `car.list` query
  - Users can now search their cars by license plate
  - Handles dash/space variations automatically

- **`car.get_by_plate` query**: New endpoint to get car by license plate
  - Normalizes input plate before lookup
  - Returns car details with last service info
  - Only returns cars owned by the authenticated user

#### User Car CRUD Summary (all scoped to user's phone)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `car.list` | query | List user's cars (with optional search by plate) |
| `car.get` | query | Get single car by ID with full stats |
| `car.get_by_plate` | query | Get car by license plate (normalized) |
| `car.add` | mutation | Add new car (plates auto-normalized, no approval needed) |
| `car.update` | mutation | Update car details (model, year, color, VIN) |
| `car.remove` | mutation | Soft delete car (can be restored by re-adding) |

#### Changed
- **`normalize_license_plate()` enhanced**: Added multiple space collapse (multiple spaces become single space)
- **`car.list`**: Now accepts optional `search` parameter for filtering by plate
- **Admin search (`list_visits`)**: Now normalizes license plate search input before querying
  - Searches both normalized and original input for maximum flexibility

#### Technical Details
- `packages/shared/src/utils/index.ts`:
  - Enhanced `normalize_license_plate()` with `replace(/\s+/g, " ")` for space collapsing
  - Added `normalize_plate_for_search()` function returning `{ normalized, stripped }`
- `packages/api/src/routers/car.ts`:
  - Added `search` input parameter to `list` query
  - Added `get_by_plate` query with plate normalization
  - Imported `normalize_plate_for_search` from shared
- `packages/api/src/routers/admin.ts`:
  - Updated `list_visits` search to normalize plate input before query

#### Files Modified
- `packages/shared/src/utils/index.ts` - Added normalize_plate_for_search, enhanced normalize_license_plate
- `packages/api/src/routers/car.ts` - Added search to list, added get_by_plate query
- `packages/api/src/routers/admin.ts` - Updated search logic with plate normalization

---

### 2026-01-24 - Fix Vercel Build

#### Fixed
- **Prisma generate on Vercel**: Added `postinstall` script to packages/db that runs `prisma generate`
- **Removed dotenv dependency**: The `generate` script no longer requires dotenv, making it work on Vercel where env vars are provided directly
- **Added generate:local**: New script for local development that uses dotenv

#### Files Modified
- `packages/db/package.json` - Added postinstall hook and fixed generate script

---

### 2026-01-23 - Fix ThaiBulkSMS OTP Verification

#### Root Cause (Part 1)
The OTP verification was comparing user input against a locally generated OTP code stored in the database,
but ThaiBulkSMS generates its own OTP and sends it to the user via SMS. The user received a different
OTP than what was stored locally, causing verification to always fail unless using the dev bypass code "000000".

#### Root Cause (Part 2)
ThaiBulkSMS API response parsing was incorrect. The API returns nested response format:
`{ data: { status: 'success', token: '...' } }` but code expected `{ code: '000', token: '...' }`.
This caused the token to not be stored even when SMS was sent successfully.

#### Fixed
- **OTP verification now uses ThaiBulkSMS API**: When SMS_PROVIDER is "thaibulksms", the verification
  now calls the ThaiBulkSMS verify endpoint instead of comparing against local database code
- **Store SMS token**: The token returned from ThaiBulkSMS OTP request is now stored in the database
  for use during verification
- **Prisma schema updated**: Added `sms_token` field to OTPToken model to store ThaiBulkSMS token
- **Fixed ThaiBulkSMS response parsing**: Now handles both response formats:
  - Format 1: `{ code: "000", token: "..." }` (legacy/documented format)
  - Format 2: `{ data: { status: "success", token: "..." } }` (actual API response)

#### Technical Details
- `packages/db/prisma/schema.prisma`: Added `sms_token String?` field to OTPToken model
- `packages/api/src/routers/auth.ts`:
  - Import `verify_otp_via_sms` from shared utilities
  - In `request_otp`: Store `sms_result.token` to OTPToken record after successful SMS send
  - In `verify_otp`: Use `verify_otp_via_sms()` API when provider is "thaibulksms" and sms_token exists
  - Fallback to local code comparison for "console" provider (development)
- `packages/shared/src/utils/sms.ts`:
  - `request_otp_via_sms()`: Handle nested `data.data.status` and `data.data.token` response
  - `verify_otp_via_sms()`: Handle nested `data.data.status` response for verification

#### Files Modified
- `packages/db/prisma/schema.prisma` - Added sms_token field
- `packages/api/src/routers/auth.ts` - Updated OTP verification logic
- `packages/shared/src/utils/sms.ts` - Fixed ThaiBulkSMS response parsing

---

### 2026-01-23 - Fix auth.ts Parse Error

#### Fixed
- **auth.ts duplicate content**: Removed duplicate docstring and imports (lines 1-17 were erroneously duplicated)
- **auth.ts syntax error**: Fixed `export const /**` fragment that broke the parser with "Expected ident" error
- **auth.ts double semicolon**: Changed `});;` to `});` at end of file

---

### 2026-01-18 - ThaiBulkSMS OTP Integration

#### Added
- **SMS OTP Service**: Complete ThaiBulkSMS integration for phone-based authentication
  - Created `packages/shared/src/utils/sms.ts` with comprehensive SMS utilities
  - `request_otp_via_sms()`: Send OTP via ThaiBulkSMS OTP API
  - `verify_otp_via_sms()`: Verify OTP code via ThaiBulkSMS API
  - `send_otp()`: Provider abstraction for sending OTP (ThaiBulkSMS or console)
  - `normalize_phone_for_sms()`: Convert Thai phone numbers to international format (66 prefix)
  - `send_sms()`: Send simple SMS messages via ThaiBulkSMS API v2
- **Provider Abstraction**: SMS provider selection via environment configuration
  - Supports `thaibulksms` for production OTP delivery
  - Supports `console` for development/testing (logs OTP to console)
  - Easy to extend with additional providers (Twilio, etc.)
- **Enhanced Authentication Flow**: Updated `request_otp` mutation to use SMS service
  - Automatically sends OTP to user's phone via ThaiBulkSMS
  - Fallback to console logging for development
  - Error handling with graceful degradation
  - Detailed logging for monitoring and debugging

#### Changed
- **Environment Configuration**: Updated `.env.example` with ThaiBulkSMS settings
  - `SMS_PROVIDER`: Provider selection (thaibulksms, console)
  - `SMS_API_KEY`: ThaiBulkSMS API key
  - `SMS_API_SECRET`: ThaiBulkSMS API secret
  - Added documentation for ThaiBulkSMS dashboard credential retrieval
- **Auth Router**: Updated to use new SMS service
  - Imported `send_otp` and `get_sms_config` from shared utilities
  - Replaced TODO comment with actual SMS integration
  - Added SMS provider logging for monitoring

#### Technical Details
- ThaiBulkSMS OTP API endpoints:
  - Request: `https://otp.thaibulksms.com/v1/otp/request`
  - Verify: `https://otp.thaibulksms.com/v1/otp/verify`
- Phone number normalization: `0917013331` → `66917013331`
- Request body: `{ key, secret, msisdn, pin }`
- Verify body: `{ key, secret, token, pin }`
- Response codes: `000` for success, other codes for errors
- Exports: `SmsOtpRequestParams`, `SmsOtpRequestResult`, `SmsOtpVerifyParams`, `SmsOtpVerifyResult` types

#### Files Created
- `packages/shared/src/utils/sms.ts` - Complete SMS service implementation

#### Files Modified
- `packages/shared/src/utils/index.ts` - Added SMS utility exports
- `packages/api/src/routers/auth.ts` - Integrated SMS sending into request_otp mutation
- `.env.example` - Updated with ThaiBulkSMS configuration

---

### 2026-01-18 - Enhanced Import Deduplication Logic

#### Added
- **Smart Deduplication**: Enhanced import_records mutation with comprehensive duplicate detection
  - Normalizes dates to compare only date portion (ignores time component)
  - Detects existing service visits for the same car on the same day
  - Checks for duplicate tire changes by position + tire_size + brand
  - Checks for duplicate oil changes by viscosity + oil_model
  - Adds new tire/oil data to existing visits instead of skipping entirely
- **Duplicate Count Reporting**: New `duplicate_count` field in import results
  - Shows separate count of skipped duplicate records
  - Updated UI to display duplicates in a 3-column grid (imported, duplicates, errors)
  - Added descriptive message when duplicates are detected
  - Added Copy icon from lucide-react for duplicate indicator

#### Changed
- **Import Page UI**: Enhanced import results display
  - 3-column grid showing: Records imported (green), Duplicates skipped (yellow), Errors (red)
  - Icons added to each result card for visual clarity
  - Toast message now includes duplicate count when applicable
  - Header icon changes based on result (success/duplicates/errors)

#### Technical Details
- `normalize_date()`: Helper function to strip time component for date comparison
- `get_day_range()`: Creates date range for Prisma queries (start to end of day)
- Existing visits are reused when adding tire/oil data for the same car+date
- Detailed logging for debugging import issues

#### Files Modified
- `packages/api/src/routers/admin.ts` - Enhanced import_records mutation
- `apps/web/src/app/admin/import/page.tsx` - Updated UI for duplicate reporting

---

### 2026-01-18 - Next.js 16 Upgrade & Vercel Deployment Config

#### Changed
- **Next.js**: Upgraded from 15.1.4 to 16.1.1
  - Full async Request APIs support (cookies, headers already async-compatible)
  - Improved performance and build optimizations
  - Turbopack improvements for faster dev builds
- **eslint-config-next**: Updated to 16.1.1 to match Next.js version
- **next-intl**: Upgraded from 3.26.3 to 4.7.0 (Next.js 16 compatible)
- **Build script**: Updated to run Prisma generate before Next.js build
  - Ensures Prisma client is generated during Vercel deployment

#### Added
- **vercel.json**: Vercel deployment configuration
  - Turborepo build command: `pnpm turbo build --filter=@tireoff/web`
  - Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
  - API routes cache control (no-store for dynamic data)
  - Git deployment enabled for main and staging branches
  - turbo-ignore for optimized builds (skip unchanged packages)
- **postinstall script**: Auto-generates Prisma client on `pnpm install`
- **.env.production**: Production environment template with pre-generated secure keys
- **.env.vercel**: Simplified Vercel-ready environment variables

#### Fixed
- **HistoryList Component**: Fixed TypeScript errors for React 19 stricter type checks
  - Added proper `HistoryEntryDetails` interface instead of `Record<string, unknown>`
  - Removed inline `as string` casts that fail in React 19
  - Added explicit return type `: React.ReactNode` to map callback

#### Deployment Notes
- Requires MongoDB Atlas or external MongoDB instance
- Environment variables needed:
  - `DATABASE_URL`: MongoDB connection string
  - `JWT_SECRET`: Authentication secret
  - `NEXT_PUBLIC_APP_URL`: Production URL
  - `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_API_SECRET`: For OTP delivery

---

### 2026-01-18 - Car Info CRUD in Topbar

#### Added
- **CarInfoSheet Component**: New component for viewing and editing car details
  - Opens from info button in SelectedCarHeader
  - View mode: Displays car model, year, color, and VIN with icons
  - Edit mode: Form to update all optional car fields
  - Delete confirmation dialog with soft delete functionality
  - i18n translations for all UI elements (TH/EN)
- **car.update API endpoint**: New mutation in car router for updating car details
  - Updates car_model, car_year, car_color, car_vin
  - Validates ownership before allowing updates
  - License plate cannot be changed (use remove and add instead)
- **update_car_schema validator**: Zod schema for update car input validation
- **UpdateCarInput type**: TypeScript type export for update car input

#### Changed
- **SelectedCarHeader Component**: Enhanced with car info display and CRUD access
  - Added info button (ℹ️) to open CarInfoSheet
  - Now displays car model, year, and color in subtitle
  - Updated interface to include car_year, car_color, car_vin
- **CarsProvider**: Updated to include all car fields
  - Car interface now includes car_year, car_color, car_vin
  - Added update_selected_car function for updating selected car state
- **PlateList Component**: Enhanced car info display
  - Updated Plate interface to include car_year, car_color, car_vin
  - PlateCard now shows model, year, color in subtitle (e.g., "Toyota Camry • 2023 • White")
- **car.list API**: Now returns car_year, car_color, car_vin fields
- **car.get API**: Now returns car_year, car_color, car_vin fields

#### i18n
- Added Thai translations:
  - `car.update_success`: "อัปเดตข้อมูลรถสำเร็จ!"
  - `car.update_failed`: "ไม่สามารถอัปเดตข้อมูลรถได้"
  - `car.remove_success`: "นำรถออกสำเร็จ!"
  - `car.remove_failed`: "ไม่สามารถนำรถออกได้"
- Added English translations for all new car CRUD operations

---

### 2026-01-18 - UI Styling: White Background & Uppercase Headers

#### Changed
- **Background Color**: Changed app background from grey (98% lightness) to pure white (100% lightness)
  - Updated `--background: 0 0% 98%` to `--background: 0 0% 100%` in `globals.css`
- **Header Titles**: Made all header titles uppercase across the application
  - `CardTitle` component: Added `uppercase` class for consistent styling
  - `UserProfile` headers: Account Info, Settings, Actions sections now uppercase
  - `TireInfoList` headers: Tire position headers (FL, FR, RL, RR) now uppercase
  - `OilChangeHistory` header: Oil change title now uppercase
  - `UserHeader` logo: TireOff brand text now uppercase
  - `AddPlateForm` header: Vehicle Info title now uppercase

#### Files Modified
- `apps/web/src/app/globals.css` - Background color CSS variable
- `apps/web/src/components/ui/card.tsx` - CardTitle component
- `apps/web/src/components/user/user_profile.tsx` - Section headers
- `apps/web/src/components/service/tire_info_list.tsx` - Position headers
- `apps/web/src/components/service/oil_change_history.tsx` - Oil title header
- `apps/web/src/components/layout/user_header.tsx` - Logo text
- `apps/web/src/components/cars/add_plate_form.tsx` - Form header

---

### 2026-01-18 - History Tab for All Service Logs

#### Added
- **History Tab**: New bottom navigation tab showing all service history across all registered cars
  - Added `/history` page with unified timeline view
  - Created `HistoryList` component (`apps/web/src/components/history/history_list.tsx`)
  - Shows all tire changes, tire switches, and oil changes in one timeline
  - Each log entry displays: service type badge, license plate, date, odometer, branch
  - Service-specific details: tire position/brand, switch direction, oil model/viscosity
  - Color-coded service types: blue (tire change), green (tire switch), amber (oil change)
  - Skeleton loading state for better UX
- **service.all_history API endpoint**: New tRPC endpoint returning all service logs
  - Fetches all service visits for all cars owned by the user
  - Returns unified array of tire changes, tire switches, and oil changes
  - Sorted by date descending (newest first)
  - Includes car license plate and branch info for each entry
- **i18n translations**: Added `history` namespace with all history page strings (TH/EN)
  - `nav.history`: "ประวัติ" (TH) / "HISTORY" (EN)
  - `history.title`, `history.no_records`, `history.tire_change`, etc.

#### Changed
- **BottomNavigation**: Added History tab between Cars and User
  - New `History` icon from lucide-react
  - Updated `is_active()` function to handle `/history` route

---

### 2026-01-17 - Navigation i18n & Fixed Positioning

#### Changed
- **ServiceTabs Component**: Added i18n support and changed positioning
  - Labels now use i18n translations (`nav.tire`, `nav.switch`, `nav.oil`)
  - Changed from `sticky top-[4rem]` to `fixed top-[4rem] left-0 right-0`
  - Fixed positioning ensures consistent behavior across scroll positions
- **BottomNavigation Component**: Added i18n support
  - Labels now use i18n translations (`nav.cars`, `nav.user`)
  - Replaced hardcoded "CARS" and "USER" with dynamic translations
- **SelectedCarHeader Component**: Changed positioning
  - Changed from `sticky top-0` to `fixed top-0 left-0 right-0`
  - Fixed positioning ensures header stays visible at top
- **CarsLayoutClient Component**: Added content spacing for fixed headers
  - Added `pt-[8.5rem]` padding when car is selected (accounts for SelectedCarHeader + ServiceTabs)
  - Content no longer hidden behind fixed headers

#### Added
- **i18n translations**: Added navigation labels to both TH and EN
  - `nav.tire`: "ยาง" (TH) / "Tire" (EN)
  - `nav.switch`: "สลับยาง" (TH) / "Switch" (EN)
  - `nav.oil`: "น้ำมัน" (TH) / "Oil" (EN)
  - `nav.cars`: "รถ" (TH) / "CARS" (EN)
  - `nav.user`: "ผู้ใช้" (TH) / "USER" (EN)

---

### 2026-01-17 - User Profile Page i18n

#### Fixed
- **UserProfile Component**: Replaced all hardcoded strings with i18n translations
  - "Account Information" → `profile.account_info`
  - "Phone Number" → `profile.phone_number`
  - "Registered Plates" → `profile.registered_plates`
  - "X plate(s)" → `profile.plates_count`
  - "Settings" → `profile.settings`
  - "Language" → `profile.language`
  - "Actions" → `profile.actions`
  - "Logged out successfully" → `profile.logout_success`
- **User Page**: Title "My Account" now uses i18n (`profile.title`)

#### Added
- **i18n translations**: Added `profile` namespace with all user page strings (TH/EN)

---

### 2026-01-17 - Vehicle Registration Form with i18n

#### Changed
- **AddPlateForm Component**: Redesigned with i18n support and optional fields
  - Header: "Vehicle Information" / "ข้อมูลรถยนต์" with Car icon
  - Subtitle: "Enter your Thai license plate number" / "กรอกทะเบียนรถของคุณ"
  - License Plate field (required) with format helper text
  - All text now uses i18n translations (TH/EN)

#### Added
- **Optional vehicle fields** in registration form:
  - Vehicle Model (รุ่นรถ) - e.g., Toyota Camry 2023
  - Vehicle Year (ปีรถ) - e.g., 2023
  - Vehicle Color (สีรถ) - e.g., White, Black, Silver
  - VIN Number (หมายเลขตัวถัง) - e.g., JTDKN3DU5A0000001
- **Prisma Car model**: Added `car_year`, `car_color`, `car_vin` optional fields
- **add_car_schema**: Extended with new optional fields
- **i18n translations**: Added comprehensive vehicle form translations
  - `car.vehicle_info`, `car.vehicle_info_subtitle`
  - `car.car_year`, `car.car_color`, `car.car_vin`
  - `car.required`, `car.optional`, `car.register_plate`
  - `car.plate_registered`, `car.plate_registered_message`
  - `car.add_another`, `car.view_plates`
  - `car.register_success`, `car.register_failed`
  - `car.license_plate_format`

---

### 2026-01-17 - Remove TireTrack Header

#### Removed
- **MobileHeader**: Removed TireTrack title header from all layouts
  - Removed from `cars_layout_client.tsx`
  - Removed from `user_layout.tsx`
  - App now starts directly with content, no top branding header

#### Fixed
- **SelectedCarHeader**: Fixed sticky positioning from `top-14` to `top-0`
- **ServiceTabs**: Fixed sticky positioning from `top-[7.5rem]` to `top-[4rem]`
- Removed empty space left by old header

---

### 2026-01-17 - Tire Card Shows Last Changed Date

#### Changed
- **TireCardCompact Component**: Now shows last changed date instead of percentage
  - Displays "เปลี่ยนล่าสุด:" label with Calendar icon
  - Shows install date in Thai format (e.g., "25 มกราคม 2567")
  - Shows days since tire was changed (e.g., "365 วัน")
  - Removed: position name, percentage, remaining km display

#### Added
- **i18n translations**: Added new tire translation keys
  - `tire.last_changed`: "เปลี่ยนล่าสุด" (TH) / "Last changed" (EN)
  - `tire.days_ago`: "วัน" (TH) / "days" (EN)

---

### 2026-01-17 - Realistic Car Visual in Tire Tab

#### Changed
- **CarSilhouette Component**: Redesigned car SVG with realistic top-down sedan view
  - Proper car body contours with hood, cabin, and trunk sections
  - Front and rear windshields with glass effect (sky-blue fill)
  - Side mirrors with mounting arms
  - Front headlights and rear taillights (red)
  - Wheel arches for all 4 tire positions
  - Realistic tires with rounded rectangle shape and tread lines
  - Door lines and roof center line detail
  - Front grille and rear license plate area
  - Subtle shadow under vehicle for depth
  - **Blue color scheme**: All car body parts use blue shades (blue-400 to blue-900)
    - Body: blue-400 fill with blue-600 stroke
    - Roof/cabin: blue-500
    - Wheels: blue-700/blue-900 for realistic tire appearance
    - Windows: sky-300 (light blue glass effect)
  - **Enlarged car size**: Now 280x500px for better visibility

- **TireStatusVisual Layout**: Tire cards now overlay on top of car
  - Cards positioned at each wheel location (FL, FR, RL, RR)
  - Compact card design with semi-transparent background (white/95 with blur)
  - Shows position name (หน้าซ้าย, หน้าขวา, etc.), percentage, and remaining km
  - Cards float over car visual using absolute positioning
  - Creates modern layered visual effect

#### Added
- **TireCardCompact Component**: New compact tire card for overlay display
  - Smaller font sizes optimized for overlay positioning
  - Glass morphism effect (backdrop-blur-sm)
  - Shows: position icon, position name, usage %, remaining km

- **TireStatusOverview**: Re-integrated `TireStatusVisual` component
  - Shows car visual at top of Tire tab
  - Displays tire status cards overlapping on the car diagram
  - Maintains tire info list below for detailed information
  - Updated skeleton loader for new layout

---

### 2026-01-17 - Tire Tab Redesign: Info List Layout

#### Added
- **TireInfoList Component**: New tire info display with vertical card list format
  - Created `tire_info_list.tsx` component
  - Each tire card shows:
    - Position header with code (e.g., "หน้าซ้าย (FL)")
    - Tire brand and model (e.g., "Michelin Primacy 4")
    - Tire size (e.g., "ขนาดยาง : 245/45R18")
    - Last change date (e.g., "เปลี่ยนล่าสุด: 12 ม.ค. 2025")
    - Odometer at change (e.g., "เลขไมล์: 52,300")
    - "ดูรายละเอียด" button for expandable details
  - Order: FL → FR → RL → RR

#### Changed
- **TireStatusOverview**: Replaced car visual diagram with TireInfoList
  - Removed car silhouette SVG visualization
  - Now shows simple vertical list of tire info cards
  - Updated skeleton loader to match new list layout

#### Removed
- **TireStatusOverview**: Removed all NextServiceCard components from the Tire tab
  - Removed "สลับยาง" (tire switch) card
  - Removed "เปลี่ยนน้ำมันเครื่อง" (oil change) card
  - Removed unused `NextServiceCard` import

---

### 2026-01-17 - Tire Switch Tab: Enhanced Log Display with Next Service Recommendation

#### Changed
- **TireSwitchHistory Component**: Redesigned tire switch log display with detailed format
  - Each log entry now shows structured card format with:
    - Header: 🔄 การสลับยาง / ตรวจเช็คสภาพ (Tire Rotation / Condition Check)
    - Latest tire switch section with date and mileage
    - Next service recommendation section showing:
      - Recommended next mileage (+10,000 km from last service)
      - "หรือ ภายใน 6 เดือน" (or within 6 months)
      - Recommended next date (+6 months from last service)
    - Footer note: แนะนำตรวจเช็คทุก 10,000 กม. หรือ 6 เดือน
  - Uses `SERVICE_INTERVALS` constants for consistent recommendations
  - Added `add_months()` utility function for date calculations
  - Updated imports to use `CardHeader`, `CardTitle` for proper card structure
  - Changed icons: uses `Calendar`, `Car`, `ArrowRight` from lucide-react

---

### 2026-01-17 - Oil Tab Redesign

#### Changed
- **OilChangeHistory**: Redesigned Oil tab with new simplified layout
  - Shows latest oil change in a clean card format
  - Header: Oil icon + title with oil type (สังเคราะห์แท้/กึ่งสังเคราะห์/ธรรมดา)
  - Oil model and viscosity display
  - Last change date (เปลี่ยนล่าสุด)
  - Odometer at last change (เลขไมล์)
  - Next service recommendation based on oil type:
    - สังเคราะห์แท้ (Synthetic): 10,000 km
    - กึ่งสังเคราะห์ (Semi-synthetic): 7,000 km
    - ธรรมดา (Conventional): 5,000 km
  - Recommendation note with interval

#### Added
- **i18n translations**: Added new oil-related translation keys
  - `oil.title`, `oil.type_synthetic`, `oil.type_semi_synthetic`, `oil.type_conventional`
  - `oil.last_change`, `oil.odometer`, `oil.next_service`, `oil.approx`, `oil.no_data`
  - Added to both th.json and en.json

---

### 2026-01-17 - UI Cleanup: Remove Tire History from Tire Tab

#### Removed
- **Tire Change History**: Removed history toggle and list from Tire tab
  - Simplified `TireChangeHistory` component to only show `TireStatusOverview`
  - Removed "ประวัติเปลี่ยนยาง" toggle button
  - Removed collapsible tire change history list
  - Tire tab now shows only: tire status visual + next service cards (tire switch, oil change)

---

### 2026-01-17 - Database Seed Script for Mockup Data

#### Added
- **Seed Script**: Created database seed script for generating mockup car data
  - Created `packages/db/prisma/seed.ts` with comprehensive mockup data generation
  - Added `pnpm seed` command to packages/db for running seed script
  - Added `tsx` dev dependency for TypeScript execution
  - Generated mockup data for account `0917013331`:
    - 3 cars with Thai license plates (กข 1234, 1กก 5678, ขค 9012)
    - Multiple service visits per car spanning 2 years
    - Tire change records for all 4 positions (FL, FR, RL, RR)
    - Tire switch/rotation records
    - Oil change records with different oil types and viscosities
  - Thai tire brands (Bridgestone, Michelin, etc.) and realistic pricing
  - Realistic odometer readings and service intervals

---

### 2026-01-17 - Visual Car Tire Status Display

#### Added
- **TireStatusVisual Component**: New visual tire status display with car-centered layout
  - Created `TireStatusVisual` component (`apps/web/src/components/service/tire_status_visual.tsx`)
  - Shows car silhouette (SVG top-down view) in center
  - Top row: Front Left (FL) and Front Right (FR) tire cards
  - Bottom row: Rear Left (RL) and Rear Right (RR) tire cards
  - SVG car silhouette with wheel indicators for spatial reference
  - Each tire card displays: position label, status icon, remaining %, progress bar, remaining km
  - Color-coded status: blue (good), orange (warning/critical), red (overdue)
  - Displays remaining condition % (100 - usage_percent) for intuitive reading

#### Changed
- **TireStatusOverview**: Now uses `TireStatusVisual` instead of grid layout
  - Replaced 2x2 grid of `TireStatusCard` with new visual car-centered layout
  - Updated loading skeleton to match new visual structure
  - Maintains same data flow and API integration
- **Font**: Switched from Noto Sans Thai to IBM Plex Sans Thai
  - Updated Google Fonts import in `globals.css`
  - Updated font-family in body styles
- **Icons**: Replaced all emoji with Lucide icons
  - Replaced car emoji (🚘) with `Car` icon from lucide-react
- **TireStatusOverview**: Removed redundant text elements
  - Removed "License Plate: xxx" car info section
  - Removed "Tire Status by Position" heading
  - Cleaner visual-only tire status display
- **BottomNavigation**: Changed menu labels to uppercase ("CARS", "USER")
- **UserProfile**: Added language toggle feature
  - New "Settings" card with language toggle button
  - Shows current language (ไทย/English) with Globe icon
  - Button to switch between EN and TH
  - Saves preference to locale cookie

---

### 2026-01-17 - UI Refinements

#### Changed
- **BottomNavigation**: Made bottom menu smaller
  - Reduced vertical padding from `py-3` to `py-2`
  - Reduced gap between icon and label from `gap-1` to `gap-0.5`
  - Reduced icon container padding from `p-2` to `p-1.5`
  - Reduced icon size from `h-5 w-5` to `h-4 w-4`
  - Changed border radius from `rounded-xl` to `rounded-lg`

---

### 2026-01-17 - Car Selection Flow for Service Tabs

#### Added
- **Car Selection Flow**: New UX pattern where car must be selected before viewing service data
  - Updated `CarsProvider` with `selected_car` state, `select_car()`, and `clear_selection()` functions
  - Created `SelectedCarHeader` component showing selected car with close button to deselect
  - Updated `PlateList` to support clickable cards with `on_select` callback and selection highlighting
  - Updated `CarsLayoutClient` to conditionally show `SelectedCarHeader` and `ServiceTabs` only when car is selected
  - Updated `CarsContent` to show car list overview when no car selected, or service data when selected
  - Updated `/cars` (Tire), `/cars/switch`, `/cars/oil` pages to pass appropriate service history components

#### Changed
- **Navigation Flow**:
  - Cars tab now shows list of cars first (overview)
  - User clicks a car to select it
  - After selection: shows selected car header + Tire/Switch/Oil tabs with service data
  - Clicking X on selected car header returns to car list
- **ServiceTabs** positioning adjusted to account for SelectedCarHeader height (top-[7.5rem])

---

### 2026-01-17 - UI Simplification & Remove Approval Workflow

#### Fixed
- **TypeScript type error in trpc.ts**: Fixed Prisma session include type inference
  - Added `SessionWithUser` type using `Prisma.SessionGetPayload<{ include: { user: true } }>`
  - Updated session query to properly type the included user relation
  - Build now compiles successfully

#### Removed
- **Plate Approval System**: Removed entire approval workflow
  - Removed `ApprovalStatus` enum from Prisma schema
  - Removed `approval_status`, `approved_at`, `approved_by` fields from Car model
  - Removed `pending_plates`, `approve_plate`, `reject_plate` from admin API
  - Removed `/admin/approvals` page
  - Removed pending plates alert from admin dashboard
  - Plates now work immediately upon registration (no approval needed)

#### Changed
- **UI Cleanup - Removed Gradients & Glass Effects**
  - Simplified `globals.css` - removed all gradient and glass morphism utilities
  - Updated `MobileHeader` - clean white header with border
  - Updated `BottomNavigation` - clean white navigation with solid colors
  - Updated `ServiceTabs` - clean tab design without gradients
  - Updated `Button` component - solid colors instead of gradients
  - Updated `Card` component - simple border instead of glass effect
  - Updated `Input` component - clean border styling
  - Updated `Login` page - removed decorative gradient blobs
  - Updated `UserProfile` - clean card design without gradients
  - Updated `PlateList` - simplified cards without status badges
  - Updated `AddPlateForm` - removed pending approval message
- **Font**: Using Noto Sans Thai from Google Fonts (already configured)
- **Metadata**: Updated app title from "TireOff" to "TireTrack"

---

### 2026-01-17 - Tire Status Overview & Usage Tracking

#### Added
- **Tire Status Overview**: New dashboard showing tire status per position
  - Added `User.name` field to Prisma schema for customer name display
  - Created tire usage calculation utilities in shared package:
    - `calculate_tire_usage()` - Calculates usage % based on mileage since installation
    - `calculate_next_tire_switch()` - Calculates next recommended tire switch date/km
    - `calculate_next_oil_change()` - Calculates next recommended oil change date/km
    - `get_oil_interval_km()` - Gets interval based on oil type (synthetic, semi-synthetic, conventional)
  - Added `SERVICE_INTERVALS` constants for tire lifespan (50,000km) and service intervals
  - Added `TIRE_USAGE_THRESHOLDS` constants (good: 0-50%, warning: 50-80%, critical: 80-100%)
  - Created `service.tire_status` API endpoint returning:
    - Current tire status per position (FL, FR, RL, RR) with usage %
    - Next tire switch recommendation with date/km
    - Next oil change recommendation with date/km
  - Added i18n translations for tire status and next service (th/en)
- **UI Components**: New collapsible tire status cards
  - Created `TireStatusCard` component with:
    - Color-coded status indicators (green/yellow/orange/red)
    - Usage percentage progress bar
    - Collapsible details (tire info, install date, branch, price)
  - Created `NextServiceCard` component showing:
    - Last service date and mileage
    - Next recommended service date and mileage
    - Time/distance remaining (overdue if exceeded)
  - Created `TireStatusOverview` component combining all status cards
  - Integrated overview into `TireChangeHistory` with collapsible history toggle

---

### 2026-01-17 - Mobile-First Redesign & Plate Approval System

#### Added
- **Mobile-First Layout**: New responsive layout with header and bottom navigation
  - Created `MobileHeader` component (simple centered logo)
  - Created `BottomNavigation` component with Cars and User tabs
  - Created `ServiceTabs` component for Tire, Tire Switch, Oil sub-tabs
  - Created `UserLayout` wrapper component
  - Created `/user` page with `UserProfile` component
  - Created `/cars/switch` page for tire switch history
  - Created `/cars/oil` page for oil change history
- **Plate Approval System**: Admin workflow for approving user-registered plates
  - Added `ApprovalStatus` enum to Prisma schema (PENDING, APPROVED, REJECTED)
  - Added `approval_status`, `approved_at`, `approved_by` fields to Car model
  - Created `/admin/approvals` page with approve/reject functionality
  - Added pending plates count to admin dashboard
  - Added pending plates alert banner linking to approvals page
- **Add Plate Flow**: Simplified user flow for registering plates
  - Created `/add-plate` page with form
  - Created `AddPlateForm` component with success state
  - Created `PlateList` component showing approval status badges

#### Changed
- **Light Mode Only**: Forced light theme across the application
  - Updated ThemeProvider to use `forcedTheme="light"`
  - Removed dark mode CSS variables from globals.css
  - Simplified viewport themeColor to white
- **Rebranded**: Changed app name from "TireOff" to "TireTrack"
- **Login Page**: Updated with mobile-first gradient design
- **Cars Page**: Updated to use new UserLayout with PlateList component
- **Admin Layout**: Added "Plate Approvals" navigation item

#### Performance Optimizations
- **State Management**: Added React Context for shared car data across tabs
  - Created `CarsProvider` with tRPC caching (staleTime: 5min, gcTime: 10min)
  - Created `useCars` hook for accessing shared context
  - Data is fetched once and reused across Tire, Tire Switch, and Oil tabs
- **Shared Layout**: Created cars layout with provider wrapping all car pages
  - Created `cars/layout.tsx` server component for auth check
  - Created `CarsLayoutClient` for client-side state management
  - Created `CarsContent` component consuming shared context
- **Loading States**: Added skeleton loading for better perceived performance
  - Created `PlateListSkeleton` component with animated placeholders
  - Shows skeleton during initial data fetch
- **Component Memoization**: Optimized navigation components
  - Memoized `ServiceTabs` with `React.memo` to prevent re-renders on page change
  - Memoized `BottomNavigation` with `React.memo`
- **Link Prefetching**: Added `prefetch={true}` to all navigation links for instant navigation

#### UI Redesign - Glass Morphism & Gradients
- **Design System**: Complete visual overhaul with modern glass morphism style
  - Added gradient background utilities (bg-gradient-soft, bg-gradient-primary, etc.)
  - Added glass morphism classes (glass, glass-strong, glass-subtle)
  - Added stroke borders instead of shadows (stroke-border, stroke-border-strong)
  - Added gradient blob decorations for background depth
  - Added pill-shaped utilities for rounded elements
- **MobileHeader**: Glass morphism header with gradient logo text
- **BottomNavigation**: Glass background with stroke border, gradient active state
- **ServiceTabs**: Pill-shaped buttons with gradient active state
- **PlateList Cards**: Glass cards with stroke borders, gradient status badges
- **Button Component**: Gradient primary buttons, pill-shaped, no shadows
- **Input Component**: Glass style inputs with subtle borders
- **Card Component**: Glass morphism with stroke borders
- **Login Page**: Gradient background with decorative blobs
- **UserProfile**: Glass cards with gradient icon backgrounds
- **AddPlateForm**: Glass morphism form with gradient header

#### API Changes
- `car.list`: Now includes `approval_status` and `approved_at` in response
- `admin.stats`: Now includes `pending_plates` count
- `admin.pending_plates`: New query for listing plates by approval status
- `admin.approve_plate`: New mutation to approve a plate
- `admin.reject_plate`: New mutation to reject a plate

---

### 2026-01-17 - Build System & Environment Fixes

#### Fixed
- Fixed Prisma schema duplicate index error on `Car.license_plate` (removed redundant `@@index([license_plate])` since `@unique` already creates an index)
- Fixed DATABASE_URL not found error during `prisma db push` by adding `dotenv-cli` to load root `.env` file from packages/db
- Fixed DATABASE_URL runtime error in Next.js by symlinking `apps/web/.env` to root `.env`
- Fixed @prisma/client external package warning in Next.js by configuring `serverExternalPackages: []`
- Fixed Turbopack cache issues with i18n dynamic imports (already using static imports)

#### Added
- **Development OTP Bypass**: Use code `000000` to bypass OTP verification in development mode
  - Auto-creates user if not exists
  - Only works when `NODE_ENV !== 'production'`
  - Logs when bypass is used for debugging

#### Changed
- Updated Makefile with improved commands:
  - Added `make reinstall` for full clean + install
  - Added `make clean-cache` for quick cache cleanup
  - `make dev` now cleans cache before starting
  - Better error handling and progress messages
- Updated packages/db scripts to use `dotenv -e ../../.env --` prefix for Prisma commands
- Added `dotenv-cli` as devDependency in root and packages/db

---

### 2026-01-17 - Admin Portal & Theming

#### Admin Portal Implementation
- Created admin login with hardcoded credentials (admin/tireoff2024)
- Built admin dashboard with stats overview (total visits, cars, users, branches)
- Implemented service records data table with CRUD operations
- Added search/filter by license plate, phone, branch, date range
- Created branch management page with add/edit functionality
- Built Excel/CSV import page with Thai column header mapping
- Support for .xlsx, .xls, .csv file formats

#### Theming & Styling
- Updated color scheme to orange theme (hsl 24.6 95% 53.1%)
- Integrated Noto Sans Thai font for Thai language support
- Added dark mode color variables

#### Development Tooling
- Created Makefile with common dev commands (install, dev, build, db-push, etc.)
- Added react-dropzone for file upload
- Added xlsx library for Excel parsing

#### Admin Pages Created
- `/admin/login` - Admin authentication
- `/admin` - Dashboard with statistics
- `/admin/services` - Service records management
- `/admin/branches` - Branch CRUD
- `/admin/import` - Excel/CSV data import

---

### 2026-01-17 - Project Initialization & Core Implementation

#### Completed
- Created monorepo structure with Turborepo + pnpm workspaces
- Implemented full Prisma schema for MongoDB with all models
- Set up tRPC with type-safe routers for auth, car, service, branch
- Configured i18n with next-intl for Thai/English
- Created shadcn/ui components (Button, Card, Dialog, Tabs, etc.)
- Implemented OTP-based authentication flow
- Built car management features (list, add, remove)
- Created service history views with tabs (tire change, tire switch, oil change)

#### Monorepo Structure
```
tireoff/
├── apps/
│   └── web/          # Next.js 16 frontend
├── packages/
│   ├── api/          # tRPC routers
│   ├── db/           # Prisma + MongoDB
│   └── shared/       # Types, validators, i18n, utils
├── turbo.json
└── pnpm-workspace.yaml
```

#### Planning
- Read PRD.md and BRD.md for complete requirements understanding
- Created TODOS.md with detailed implementation plan
- Tech stack decided: Next.js 16 + MongoDB + Prisma + tRPC + next-intl + shadcn/ui

#### Architecture Decisions
- **Database**: MongoDB with Prisma ORM for flexible document storage of service records
- **API**: tRPC for type-safe API layer between frontend and backend
- **i18n**: next-intl for Thai (primary) and English language support
- **UI**: shadcn/ui for consistent, accessible mobile-first design
- **Auth**: Phone + OTP authentication (no password)

#### Key Models Planned
1. User (phone-keyed)
2. Car (license plate + owner)
3. ServiceVisit (header)
4. TireChange (per position FL/FR/RL/RR)
5. TireSwitch (position movement)
6. OilChange
7. Branch
8. AdminUser
9. ImportBatch (audit)

---

## Version History Format

### [X.Y.Z] - YYYY-MM-DD
#### Added
- New features

#### Changed
- Changes in existing functionality

#### Fixed
- Bug fixes

#### Removed
- Removed features
