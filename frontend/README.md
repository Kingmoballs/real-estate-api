# Haven frontend

React frontend for the real-estate marketplace API. The marketplace supports properties for sale, long-term rentals, and serviced shortlets, with dedicated user, agent, and administrator experiences.

## Local development

1. Copy `.env.example` to `.env` if you need to override the local API URL.
2. Start the backend API from the repository root.
3. Start this frontend with `npm run dev`.

The default API base URL is `http://localhost:5000/api`.

## Validation commands

- `npm run lint`
- `npm test`
- `npm run build`

## Current implementation

The frontend includes the responsive marketplace shell, live sale/rent/shortlet discovery and detail routes, URL-based filters and pagination, cookie-and-CSRF authentication, login and registration, saved properties, customer inspection management, shortlet availability and booking requests, booking cancellation, and payment-receipt upload.

The protected agent workspace is available under `/agent` and includes:

- Dashboard totals and date-range booking analytics.
- Property creation and editing with multipart image upload.
- Draft, review, availability, rented/sold, relisting, and archive workflows.
- Inspection confirmation, rescheduling, rejection, cancellation, and completion.
- Booking approval/rejection, cancellation, and payment-receipt review.

The administrator workspace is the next implementation stage.
