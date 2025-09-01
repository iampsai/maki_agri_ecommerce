Delivery Rider & QR Workflow

Summary
- Adds Delivery Rider role and endpoints to manage riders.
- Every order now includes a riderToken and QR (data URL) which encodes { orderId, token }.
- Delivery rider can scan QR and call endpoint to set status: cancelled, in-transit, completed.
- Cancelling an order via rider scan will revert deducted stock using a DB transaction.

Key changes
- package.json: added dependency `qrcode`.
- models/orders.js: added fields `deliveryRider`, `riderToken`, `qr`, and status enum.
- models/user.js: extended `role` enum to include `rider`.
- routes/user.js: added admin endpoints to create/list riders (`/api/user/admin/create-rider`, `/api/user/admin/riders`).
- routes/orders.js:
  - Creates `riderToken` and QR when creating an order; stores QR data URL in `order.qr`.
  - New endpoint `POST /api/orders/scan/:token` - rider scans QR and hits this with { status } to update order.
  - New endpoint `PUT /api/orders/assign-rider/:id` - assign a rider and regenerate token/QR.

Example flow
1. Admin creates a rider via POST /api/user/admin/create-rider (admin token required).
2. Admin assigns rider to order via PUT /api/orders/assign-rider/:id with { riderId }.
3. Rider scans QR (which contains token), then calls POST /api/orders/scan/:token with { status: "in-transit" }.
4. On delivery, rider hits same endpoint with { status: "completed" }.
5. If rider sets { status: "cancelled" }, the product stock is reverted atomically.

Notes & Next steps
- Authentication: scan endpoint relies on possession of token. For stronger security, require rider JWT plus token match.
- Client: show `order.qr` (data URL) to admin or attach to order printout. Rider app should decode QR to get token and call `/api/orders/scan/:token`.
- SMS notifications: existing SMS logic remains unchanged; consider notifying customer on status changes.

"How to test"
- Ensure dependencies installed: `cd server && npm install`.
- Create an order via existing API; check `order.qr` is present.
- Assign a rider then POST to `/api/orders/scan/:token` with { status: "cancelled" } and verify stock restored.

