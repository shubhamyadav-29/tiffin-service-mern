# TiffinHub — Tiffin Service Management System (MERN)

A full-stack tiffin/meal-subscription platform with three roles: **User**, **Provider**, and **Admin**. Built with MongoDB, Express, React, and Node.js, integrated with AWS Free Tier services (S3, SES, EC2, CloudWatch).

## Project Structure

```
tiffin-service/
├── backend/           # Express REST API
│   ├── config/        # MongoDB, S3, SES clients
│   ├── models/        # Mongoose schemas
│   ├── controllers/   # Route logic
│   ├── routes/        # Express routers
│   ├── middleware/    # JWT auth, role guard, S3 upload, error handler
│   ├── utils/         # Token generation, SES email templates
│   └── server.js
└── frontend/           # React (Vite) + Tailwind CSS
    └── src/
        ├── api/         # Axios instance with JWT interceptor
        ├── context/      # AuthContext (login/register/logout)
        ├── components/   # Navbar, ProviderCard, RatingStars, ProtectedRoute
        └── pages/        # Home, Login, Register, ProviderList, ProviderDetail,
                           # UserDashboard, ProviderDashboard, AdminDashboard
```

## Getting Started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your MongoDB Atlas URI, JWT secret, AWS keys
npm run dev             # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev             # starts on http://localhost:5173
```

### 3. Load sample data (optional but recommended)

Once your `.env` is set up and MongoDB is reachable, run:
```bash
cd backend
npm run seed
```
This **wipes and repopulates** the database with:
- 1 admin, 2 customers, 3 approved providers (Veg / Veg & Non-Veg / Jain) + 1 provider pending approval
- Full weekly menus (breakfast/lunch/dinner) for each approved provider
- Sample subscriptions in different states (active, pending, completed) and 2 reviews

**Login credentials after seeding:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@tiffinhub.com | admin123 |
| Customer | zeke@example.com | user1234 |
| Customer | priya@example.com | user1234 |
| Provider | sunita.provider@example.com | provider123 |
| Provider | ramesh.provider@example.com | provider123 |
| Provider | jain.provider@example.com | provider123 |
| Provider (pending approval) | newprovider@example.com | provider123 |

Use the pending provider + admin login together to test the approval flow, and the "priya" pending subscription to test the provider's accept flow.

### 4. Create an admin account (manual method, if you skip seeding)
If you didn't run `npm run seed`, there's no public admin signup (by design). After registering a normal user via the app,
manually update that user's `role` field to `"admin"` directly in MongoDB Compass/Atlas:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## API Overview

| Area | Base route | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, me |
| Providers | `/api/providers` | browse/search (public), profile + bookings (provider-only under `/me`) |
| Menus | `/api/menus` | public GET by provider, provider-only create/update/delete |
| Subscriptions | `/api/subscriptions` | user-only: create (pending_payment), get by id, pause, resume, cancel |
| Payments | `/api/payments` | user-only: create-order, verify, failure, payment history |
| Addresses | `/api/addresses` | user-only: get/save delivery address |
| Reviews | `/api/reviews` | public GET, user-only POST, admin-only moderate |
| Admin | `/api/admin` | users, providers, bookings, reports — all admin-only |

Full route list is in `backend/routes/*.js`.

## Subscription & Payment Flow (Razorpay)

1. **Address required first** — a user must save a delivery address (`PUT /api/addresses/me`) before they can subscribe.
2. **Checkout is multi-step** (`frontend/src/pages/Checkout.jsx`): Select Provider → Choose Plan → Delivery Address → Review Order → Payment → Confirmation.
3. On "Confirm & Proceed to Payment", the backend creates a `Subscription` with `status: "pending_payment"` and `paymentStatus: "unpaid"`.
4. The frontend calls `POST /api/payments/create-order`, which creates a Razorpay order and a `Payment` record (`status: "created"`), and opens the Razorpay Checkout popup (Test Mode).
5. On success, the frontend calls `POST /api/payments/verify` with the Razorpay response. **The backend re-computes the HMAC-SHA256 signature itself** (`order_id|payment_id` signed with `RAZORPAY_KEY_SECRET`) and only trusts a payment if it matches — the frontend's claim of success is never trusted directly.
6. On verified success: `Payment.status = "paid"`, `Subscription.paymentStatus = "paid"` and `Subscription.status = "pending"` (now awaiting the provider's acceptance), a PDF receipt is generated and uploaded to S3, and a confirmation email is sent via SES.
7. On failure/cancellation, `POST /api/payments/failure` marks the payment `failed` and the subscription stays retryable — the user can hit "Retry Payment" from their dashboard (`/checkout?subscriptionId=...`), which creates a fresh Razorpay order for the same subscription.
8. **Providers can only Accept a paid booking — there is no reject option.** Since payment is captured upfront via Razorpay and no refund flow exists yet, allowing a provider to reject a paid order would leave the customer's money stuck with no way back. If a provider can't fulfil an order, the customer cancels it themselves from their dashboard. This is enforced server-side in `providerController.updateBookingStatus`, which only accepts `status: "active"`.
9. **Rating & review** is only available to the customer once a subscription reaches `status: "active"` (i.e. paid *and* accepted by the provider) or `"completed"` — enforced both server-side (`reviewController.createReview`) and in the dashboard UI.

### Razorpay Test Mode setup
1. Create a free account at [dashboard.razorpay.com](https://dashboard.razorpay.com) and switch to **Test Mode** (toggle top-left).
2. Go to **Settings → API Keys → Generate Test Key** and copy the Key ID / Key Secret into `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_test_key_secret
   ```
3. Use [Razorpay's test card numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/) to simulate successful/failed payments — no real money moves in Test Mode.
4. Receipts are generated as PDFs and uploaded to your S3 bucket under `receipts/`. If AWS isn't configured yet, payment verification still succeeds — only the receipt upload step is skipped (logged as a warning), so set up S3 too for the full flow.

## AWS Integration (Free Tier)

- **EC2** — deploy the `backend` folder here. Run behind PM2 + Nginx reverse proxy, or a simple `node server.js` inside a `t2.micro` instance for the free tier.
- **S3** — food images (profile, gallery, menu meal photos) upload directly to S3 via `multer-s3` (see `middleware/uploadMiddleware.js`). Create a bucket, set CORS to allow your frontend origin, and put the bucket name + keys in `.env`.
- **SES** — registration & booking confirmation emails (`utils/sendEmail.js`). In sandbox mode, verify both sender and recipient emails in the SES console before testing.
- **CloudWatch** — attach the CloudWatch agent to your EC2 instance to monitor CPU/memory, and ship `console.log`/`morgan` output to CloudWatch Logs for request monitoring.

**S3 bucket policy tip (for public image URLs):** either make the bucket/objects public-read, or (recommended) put a CloudFront distribution in front of the bucket and use signed/CDN URLs instead.

## What's implemented vs. what to extend

**Implemented:** JWT auth for all 3 roles, provider browse/search/filter, day-wise menu CRUD with image upload, delivery address management, multi-step checkout with Razorpay (Test Mode) payment, server-side payment signature verification, PDF receipts on S3, subscribe/pause/resume/cancel flow, provider accept-only bookings (no reject, since payments are non-refundable — gated on payment), ratings & reviews available once a subscription is active/completed (with provider avg-rating recalculation), admin provider approval + user management + revenue/analytics reports, SES emails on register, payment success, and payment failure.

**Good next additions:** a refund flow (Razorpay Refunds API) so providers *can* safely reject/cancel a paid order, Razorpay webhooks (as a backup to client-side verification, for cases where the browser closes before `/verify` is called), pagination on provider/booking lists, image compression before S3 upload, refresh tokens, unit tests (Jest + Supertest for backend, React Testing Library for frontend).

## Tech Stack
React 18 · React Router · Tailwind CSS · Axios · Node.js · Express · MongoDB Atlas · Mongoose · JWT · Multer + AWS S3 · AWS SES

<img width="1917" height="1033" alt="Screenshot 2026-08-29 193903" src="https://github.com/user-attachments/assets/889fe5c1-cdd1-4292-a313-75efffd6ab90" />

