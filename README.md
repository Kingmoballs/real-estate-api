# Real Estate API

Backend API for a multi-segment real estate platform covering:

- Shortlet and serviced-apartment bookings
- Monthly and yearly rental listings
- Properties offered for sale

The platform supports customers, verified agents, and a platform
administrator. It includes listing moderation, shortlet availability and
bookings, property inspections, reviews, saved properties, real-time chat,
notifications, and agent dashboards.

Live development API:
[https://real-estate-api-mmk1.onrender.com](https://real-estate-api-mmk1.onrender.com)

## Platform roles

| Role | Responsibilities |
| --- | --- |
| User | Browse properties, save listings, apply to become an agent, create shortlet bookings, request inspections, review eligible properties, and chat with agents. |
| Agent | Create and manage listings, manage shortlet bookings, handle inspections, reply to reviews, chat with customers, and view agent dashboard metrics. |
| Admin | Review agent applications and property submissions, inspect platform bookings and inspections, moderate reviews, and verify payments. |

Users always register with the `user` role. An administrator promotes an
approved applicant to `agent`; clients cannot select a privileged role during
registration.

## Main capabilities

- Secure registration, login, refresh-token rotation, logout, password
  changes, and email password reset
- HTTP-only authentication cookies with CSRF protection, plus Bearer-token
  support for Postman and non-browser clients
- Agent application and administrator approval workflow
- Draft, moderation, publication, relisting, rental, sale, and archive listing
  states
- Public filtering by listing type, property type, price, address, amenities,
  size, rating, and map radius
- Cloudinary image and receipt uploads
- Shortlet availability calendars and overlapping-booking prevention
- Receipt-based payment verification workflow
- Rent and sale inspection scheduling and rescheduling
- Property reviews, agent responses, and administrator moderation
- Saved properties, conversations, presence, and real-time notifications
- MongoDB persistence and Redis-backed coordination

## Technology

- Node.js 24
- Express 5
- MongoDB and Mongoose
- Redis and ioredis
- JWT, secure cookies, and CSRF tokens
- Socket.IO
- Cloudinary
- Resend
- Joi
- Jest and Supertest

## Requirements

- Node.js `>=24.14.1 <25`
- npm
- MongoDB database
- Redis service
- Cloudinary account
- Resend account

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env`.

3. Configure MongoDB, Redis, JWT, Cloudinary, Resend, and frontend URLs.

4. Create the initial platform administrator:

   ```bash
   npm run seed:admin
   ```

5. Start the API:

   ```bash
   npm run dev
   ```

The local API defaults to `http://localhost:5000`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API normally |
| `npm test` | Run the complete Jest test suite |
| `npm run test:integration` | Run only the API integration suites |
| `npm run seed:admin` | Create the first platform administrator |
| `npm run migrate:auth-security` | Apply the legacy authentication security migration |

## Frontend authentication

Browser clients should use cookie authentication:

1. Send requests with `credentials: "include"`.
2. Log in through `POST /api/auth/login`.
3. Keep the returned `csrfToken` in memory.
4. Add `X-CSRF-Token: <token>` to authenticated `POST`, `PUT`,
   `PATCH`, and `DELETE` requests.
5. If an API request returns `401`, call
   `POST /api/auth/refresh-token`, replace the in-memory CSRF token, and retry
   the original request once.

The access and refresh tokens are also stored in HTTP-only cookies. The login
response includes an access token for Postman, mobile clients, or clients that
use `Authorization: Bearer <token>`.

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for the complete frontend
integration contract, endpoint catalogue, payload rules, uploads, errors, and
Socket.IO events.

## Property categories

| Listing type | Price period | Customer action |
| --- | --- | --- |
| `shortlet` | `night` | Check dates and create a booking |
| `rent` | `month` or `year` | Contact the agent and request an inspection |
| `sale` | `total` | Contact the agent and request an inspection |

Property types include apartment, house, duplex, bungalow, land, commercial,
office, shop, and warehouse.

## Tests and security

The current suite contains unit and integration coverage for authentication,
CSRF, authorization, property rules and search, bookings, reviews, uploads,
email delivery, public-data projection, query normalization, and API health.

The core workflow integration suite starts an isolated, single-node MongoDB
replica set. Its first run downloads a local MongoDB test binary; later runs
reuse the cached binary. It never connects to or clears your Atlas database.

Run both checks before deployment:

```bash
npm test
npm audit
```

Expected security result: `0 vulnerabilities`.

## Deployment

The repository includes a Render Blueprint in `render.yaml` for:

- The Node.js web service
- A managed Redis-compatible key-value service
- Health checks at `/health`
- Required runtime and secret placeholders

Set `CLIENT_URL` to a comma-separated list of allowed frontend origins when
multiple development or presentation clients need access. Set
`PASSWORD_RESET_URL` to the deployed frontend reset-password page, not the
backend URL.

The Resend testing sender can deliver only within Resend's testing
restrictions. Replace it with a sender on a verified domain before paid
production use.

## Current product boundary

The current rent and sale journeys support discovery, contact, chat, and
inspection workflows. Online rent collection, tenancy applications, property
offers, ownership transfers, and legal-document workflows are outside the
current MVP.
