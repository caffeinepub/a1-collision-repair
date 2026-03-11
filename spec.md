# A1 Collision Repair

## Current State
- Work Orders page has a modal for viewing/editing work orders
- Modal has status controls, financials, parts management, and customer signature capture
- No delete option exists anywhere in the UI
- Customer approval section shows name, date, and signature image but has no export option
- Backend already has `deleteWorkOrder(id)` and data for approval is stored

## Requested Changes (Diff)

### Add
- Delete work order button in the WorkOrderModal actions row, with a confirmation dialog (AlertDialog) before executing
- After deletion, close the modal and refresh work orders list
- Export Approval PDF button in the Customer Approval section, visible only when a signature exists
- PDF export generates a printable document with: shop name (A1 Collision Repair), work order ID, customer name, vehicle, date in, approval printed name, approval date, and the signature image

### Modify
- WorkOrderModal: add delete button and export approval PDF button
- WorkOrders page: handle modal close + refresh after delete

### Remove
- Nothing removed

## Implementation Plan
1. In WorkOrderModal, add a red "Delete" button in the actions row that opens an AlertDialog confirmation
2. On confirm, call `actor.deleteWorkOrder(workOrderId)`, invalidate queries, and call `onClose()`
3. In the Customer Approval section, add an "Export Approval PDF" button (only shown when approval exists)
4. PDF generation uses browser print/window.print with a hidden print-only div styled for a clean approval document, or jsPDF/canvas approach -- use browser print approach with a styled div to avoid extra dependencies
5. The print div includes shop name, WO ID, customer info, vehicle, approval name, date, and signature image
