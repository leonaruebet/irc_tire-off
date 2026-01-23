PRD.md — TireOff Tire Age Tracking System (Mobile-first Web App)
Summary

TireOff Tire Age Tracking System is a mobile-first web application that lets customers log in with phone number + OTP, register one or more cars by license plate, and view their tire and oil service history. The system focuses on showing (1) tire change history, (2) tire switch/rotation history (separate view), and (3) oil change history, based on service records captured by TireOff branches/admin.

Goals

Let customers access service history quickly on mobile using phone + OTP.

Allow one phone number to manage multiple cars (license plates).

Show clear historical timelines for:

Tire changes (new tires installed)

Tire switch/rotation events (position changes)

Oil changes

Provide an admin console to manage/import service records (including tire position-level rows).

Non-Goals

No online payment or e-commerce in MVP.

No automated tire wear prediction model in MVP (only rules-based reminders if needed).

No integration with external government plate databases in MVP.

No native mobile apps in MVP (web app first; PWA optional later).

Target Users & Jobs-to-Be-Done (JTBD)
Segment	Persona	JTBD
Retail Customer	Car owner	“I want to see when and where I changed my tires/oil and at what mileage so I can plan maintenance.”
Returning Customer	Frequent TireOff visitor	“I want proof/history of tire changes and rotations to track warranty and usage.”
Branch Staff/Admin	Service admin	“I want to input/import service data accurately and make it searchable by plate + phone.”
Ops/Management	HQ operations	“I want standardized service history data for reporting and customer support.”
Functional Requirements (MoSCoW)
ID	Requirement	Priority	Notes
FR-01	Login with phone number + OTP	Must	OTP via SMS provider; rate limit + anti-abuse
FR-02	User profile keyed by phone number	Must	Phone is primary identifier
FR-03	Add/manage cars (license plate) under a phone number	Must	Plate format validation (TH)
FR-04	Car details: model (optional)	Should	From admin data (รถรุ่น)
FR-05	Car dashboard shows latest service summary	Must	Latest tire change + latest oil change + latest visit
FR-06	Tire Change History view (timeline/table)	Must	Group by service date + branch + odometer
FR-07	Tire Switch/Rotation History view (separate)	Must	Show position movement (e.g., FL→RL) when recorded
FR-08	Oil Change History view (timeline/table)	Must	Show oil model, viscosity, type, interval km
FR-09	View details per service visit	Must	Branch, date, odometer, services, total price
FR-10	Admin portal: CRUD service records	Must	Role-based access
FR-11	Admin import: CSV/Excel upload	Should	Map columns from current table format
FR-12	Data deduplication rules	Should	Prevent duplicate rows per plate/date/position
FR-13	Search in admin by plate / phone / branch / date range	Must	Fast lookup for support
FR-14	Multi-branch support	Must	Branch table + consistent naming
FR-15	Customer can request to remove a car from their account	Could	Soft-delete + audit trail
FR-16	Notifications/reminders (e.g., due at X km)	Could	Later phase; based on last odometer + interval
Admin Data Support (Current Table Fields)

System must support import/storage of these fields (Thai headers), including position-level tire rows:

ทะเบียนรถ (Plate)

เบอร์โทรศัพท์ (Phone)

รถรุ่น (Car model)

วันที่เปลื่ยนยาง (Tire change date)

สาขาที่เปลื่ยนยาง (Tire change branch)

ระยะที่เปลื่ยนยาง (กม.) (Odometer at tire change)

ไซส์ยาง (Tire size)

ยี่ห้อ (Brand)

รุ่นยาง (Tire model)

สัปดาห์ผลิต (Production week)

ราคาเส้นละ (Price per tire)

ตำแหน่ง (Position: FL/FR/RL/RR)

วันที่เข้ารับบริการ / สาขาที่เข้ารับบริการ / ระยะที่เข้ารับบริการ / บริการที่เข้ารับ (Service visit repeated columns in sample)

ราคาทั้งหมด (Total)

ชื่อรุ่น / ความหนืด / เครื่องยนต์ / ประเภทน้ำมันเครื่อง / ระยะเปลี่ยนถ่าย (กม.) (Oil fields)

Normalization rule (MVP):

Each service visit = 1 record (header) + optional detail lines:

Tire line items per position

Oil change line item (0..1 per visit)

Other services (free-text or controlled list)

Acceptance Criteria (Gherkin)

Login

Given I am on the login page
When I enter a valid phone number and request OTP
Then the system sends an OTP and shows the OTP input screen

Given I requested an OTP recently
When I request OTP again within the cooldown window
Then the system blocks the request and shows a retry timer message

Car Management

Given I am logged in
When I add a license plate that is valid and not already linked to my phone
Then the car is added to my account and shown in my car list

Given I am logged in
When I try to add a license plate already linked to another phone
Then the system asks for verification flow (policy-defined) or blocks and shows support message

Tire Change History

Given I have a car with tire change records
When I open “Tire Change History”
Then I see a list grouped by service date with branch, odometer, and tire details by position

Tire Switch/Rotation

Given I have a car with tire switch/rotation records
When I open “Tire Switch History”
Then I see each switch event with date, branch, odometer, and position mapping (from→to)

Oil Change

Given I have a car with oil change records
When I open “Oil Change History”
Then I see oil model, viscosity, oil type, service date, branch, and interval km

Admin Import

Given I am an admin
When I upload a CSV that matches the required columns
Then the system imports rows, reports successes/failures, and logs the import batch


Service Blueprint

Frontstage (User Actions & UI)

Login (phone → OTP)

Car list → add plate

Car dashboard → tabs:

Tire Change

Tire Switch

Oil Change

Service detail view (per visit)

Backstage (Systems)

OTP service

User/car linking service

Service record query (by plate)

Data normalization (group by visit date + branch + odometer)

Audit logging for admin changes
