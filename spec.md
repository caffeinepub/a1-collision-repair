# A1 Collision Repair — Shop Management App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Single shared password login (no individual accounts)
- Sidebar navigation with 4 pages
- Dashboard page with stat cards, charts, profit summary, recent work orders
- Work Orders page with search, filter chips, table, and detail modal with signature capture
- Parts Tracker page with Kanban board, parts table, and PDF export
- Monthly Reports page with month/year selector, profit breakdown, charts by job type and technician
- Full backend data models for WorkOrders, Parts, CustomerApprovals

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- Password auth: store a shared hashed password, verify on login, return session token
- WorkOrder CRUD: create, read, update, delete; fields: id, customerName, phone, vehicle, vin, color, jobType (Collision/Paint/Rust/Glass/Mechanical), status (Estimate/InProgress/Ready/Delivered/OnHold), chargeToCustomer, laborCost, technicianName, dateIn, dateDelivered, notes, approvalInfo
- Parts CRUD: create, read, update by workOrderId; fields: id, workOrderId, partName, partNumber, supplier, cost, quantity, status (NeedToOrder/Ordered/Arrived), orderedDate, arrivedDate, notes
- CustomerApproval: store printed name, signature data URL, date signed; linked to workOrder
- Computed fields: partsCost = sum of parts costs for a workOrder; netProfit = chargeToCustomer - partsCost - laborCost
- Query endpoints: getRecentWorkOrders(limit), getWorkOrdersByStatus, getWorkOrdersByMonth(month, year), getDashboardStats, getPartsByWorkOrder, getAllActiveParts

### Frontend
- Login gate: full-screen password form, store session in localStorage
- Sidebar: A1 Collision Repair branding, nav links to 4 pages
- Page 1 Dashboard: 4 stat cards (Active Jobs, In Progress, Ready to Deliver, Parts to Order), bar chart jobs by type, bar chart parts pipeline, monthly profit summary card, recent 5 work orders table
- Page 2 Work Orders: search bar, status filter chips, full table, row-click detail modal with status controls, financials section, parts list with advance buttons, signature capture canvas, edit/approve buttons
- Page 3 Parts Tracker: job filter, PDF export button, Kanban 3-column board, full parts table below
- Page 4 Monthly Reports: month/year dropdown, monthly summary, delivered jobs list, 12-month year summary, job type breakdown, technician breakdown, best month highlight
- Sample data seeded for demo purposes
