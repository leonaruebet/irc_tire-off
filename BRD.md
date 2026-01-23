BRD.md — Business Requirements Document
Business Context

TireOff needs a customer-facing system to reduce repeat questions about tire age/changes, improve customer trust via transparent history, and enable branches/HQ to quickly retrieve service records by phone and plate. Today, data exists in admin tables but is not easily searchable or customer-accessible.

Stakeholders & RACI
Role	Name	Responsibility
Product Owner	TBD	Prioritization, scope, approvals
Project Manager	TBD	Delivery plan, coordination
Tech Lead	TBD	Architecture, implementation decisions
Admin Ops Lead	TBD	Import format, branch processes
Branch Staff	TBD	Data capture, validation
Customer Support	TBD	Support workflows
Legal/Compliance	TBD	Privacy/consent requirements
Business Requirements
ID	Requirement	Source	Priority
BR-01	Customers can access service history via phone OTP	Management	High
BR-02	Records searchable by phone and plate	Ops/Support	High
BR-03	Tire changes and tire switching shown separately	Business	High
BR-04	Oil change history visible to customer	Business	Medium
BR-05	Admin can import existing table data	Ops	High
BR-06	Audit trail for edits and imports	Compliance	Medium
Scope

In Scope

Customer mobile-first web app (OTP login, plate management, history views)

Admin console (CRUD, search, import, audit)

Data model for tire events by position and oil service details

Out of Scope (MVP)

Payments, booking, loyalty points

External integrations (OEM, insurance)

Predictive analytics beyond simple interval rule