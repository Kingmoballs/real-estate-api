# Frontend API Contract

This document describes the HTTP and Socket.IO contract exposed by the Real
Estate API. It is intended to be the source of truth for frontend integration.

## Environments

| Environment | API origin |
| --- | --- |
| Local | `http://localhost:5000` |
| Render development/presentation | `https://real-estate-api-mmk1.onrender.com` |

All resource endpoints use the `/api` prefix. Health endpoints are available
at `GET /` and `GET /health`.

## Roles and access labels

| Label | Meaning |
| --- | --- |
| Public | No access token is required |
| Session | Uses the refresh cookie and CSRF token but does not require a valid access token |
| Authenticated | Any active user, agent, or administrator |
| User | The authenticated account must have role `user` |
| Agent | The authenticated account must have role `agent` |
| Admin | The authenticated account must have role `admin` |
| Owner/participant | The service verifies ownership or participation after authentication |

## Authentication contract

### Recommended browser strategy

Use HTTP-only cookies and always include credentials:

```js
const response = await fetch(`${API_URL}/api/auth/me`, {
  credentials: "include",
});
```

`POST /api/auth/login` sets:

- `token`: HTTP-only access-token cookie, 15-minute lifetime
- `refreshToken`: HTTP-only refresh-token cookie, 7-day lifetime
- `csrfToken`: readable CSRF cookie, 7-day lifetime

It also returns:

```json
{
  "message": "Login successful",
  "user": {},
  "accessToken": "jwt-access-token",
  "csrfToken": "64-character-hex-token"
}
```

Keep `csrfToken` in application memory. Do not put the refresh token in
localStorage.

### CSRF requirements

When cookie authentication is in use, send the CSRF value in
`X-CSRF-Token` on authenticated `POST`, `PUT`, `PATCH`, and `DELETE`
requests.

```js
await fetch(`${API_URL}/api/saved-properties/${propertyId}`, {
  method: "PUT",
  credentials: "include",
  headers: {
    "X-CSRF-Token": csrfToken,
  },
});
```

The following are CSRF-exempt:

- `GET`, `HEAD`, and `OPTIONS`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- Requests authenticated explicitly with `Authorization: Bearer <token>`

`refresh-token` and `logout` are not exempt when cookies are used. Send the
current CSRF token with both requests.

### Refresh flow

When a protected API request returns `401`:

1. Call `POST /api/auth/refresh-token` with credentials and the current
   `X-CSRF-Token`.
2. Replace the in-memory access and CSRF tokens with the returned values.
3. Retry the original request once.
4. If refresh fails, clear authenticated frontend state and show the login
   page.

Refresh response:

```json
{
  "accessToken": "new-jwt-access-token",
  "csrfToken": "new-csrf-token"
}
```

### Bearer clients

Postman, mobile clients, and trusted non-browser clients can use:

```http
Authorization: Bearer <accessToken>
```

Bearer-authenticated requests do not require a CSRF header.

## Response and error conventions

Successful response shapes are resource-specific. Paginated results include:

```json
{
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

The pagination values are numbers.

Handled errors use:

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

Body and query validation errors also include:

```json
{
  "message": "Validation error",
  "details": ["\"email\" must be a valid email"]
}
```

Common status codes:

| Code | Meaning |
| --- | --- |
| `200` | Successful read or update |
| `201` | Resource created |
| `400` | Invalid body, query, identifier, or state transition |
| `401` | Missing, invalid, or expired authentication |
| `403` | Invalid CSRF token, suspended account, or insufficient role |
| `404` | Resource or route not found |
| `409` | Duplicate resource or business-state conflict |
| `429` | Rate limit exceeded |
| `500` | Unexpected server failure |

## Endpoint catalogue

### Authentication — `/api/auth`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/csrf-token` | Public | — | Set and return a CSRF token |
| POST | `/register` | Public | `name, email, password, phone` | Register a user account |
| POST | `/login` | Public | `email, password` | Authenticate and set cookies |
| POST | `/forgot-password` | Public | `email` | Send reset instructions when an active account exists |
| POST | `/reset-password` | Public | `token, newPassword` | Consume a reset token |
| POST | `/refresh-token` | Session | Refresh cookie; CSRF header | Rotate refresh/access tokens |
| POST | `/logout` | Session | CSRF header | Revoke the refresh session and clear cookies |
| PATCH | `/change-password` | Authenticated | `currentPassword, newPassword` | Change password and require login again |
| GET | `/me` | Authenticated | — | Return current user identity and role |

Password rules: 12–128 characters with at least one lowercase letter,
uppercase letter, number, and special character.

### Agent applications — `/api/agent-applications`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/` | User | Application body | Apply to become an agent |
| GET | `/me` | Authenticated | — | Get the current account's application |
| GET | `/admin` | Admin | `status, page, limit` | List applications |
| GET | `/admin/:applicationId` | Admin | — | Get one application |
| PATCH | `/admin/:applicationId/approve` | Admin | — | Approve and promote applicant |
| PATCH | `/admin/:applicationId/reject` | Admin | `reason` | Reject an application |

Application body:

```json
{
  "businessType": "individual",
  "businessName": "Example Realty",
  "registrationNumber": null,
  "yearsOfExperience": 5,
  "serviceAreas": ["Lekki", "Victoria Island"],
  "officeAddress": "10 Example Street, Lagos",
  "bio": "At least 30 characters describing the applicant."
}
```

`businessType` is `individual` or `company`. A company must provide
`registrationNumber`.

### Properties — `/api/properties`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/` | Public | Public property filters | Browse published properties |
| GET | `/:id` | Public | — | Get one published property |
| GET | `/mine` | Agent | `status, listingType, propertyType, city, page, limit` | List the agent's properties |
| GET | `/mine/:id` | Agent/owner | — | Get an owned property |
| POST | `/` | Agent | Multipart property body | Create draft or submit listing |
| PUT | `/:id` | Agent/owner | Multipart update | Update an owned listing |
| PATCH | `/:id` | Agent/owner | Multipart partial update | Partially update an owned listing |
| PATCH | `/:id/submit-for-review` | Agent/owner | — | Submit a draft/rejected listing |
| PATCH | `/:id/status` | Agent/owner | `status` | Apply an allowed listing transition |
| PATCH | `/:id/relist` | Agent/owner | — | Relist an eligible property |
| DELETE | `/:id` | Agent/owner | — | Archive an owned property |
| GET | `/admin` | Admin | Admin property filters | List all listings |
| GET | `/admin/:id` | Admin | — | Get property with moderation data |
| PATCH | `/admin/:id/approve` | Admin | — | Publish a pending listing |
| PATCH | `/admin/:id/reject` | Admin | `reason` | Reject a pending listing |

Property creation and updates use `multipart/form-data`. Image field name:
`images`. Do not set `Content-Type` manually when sending `FormData`.

Core property fields:

| Field | Values or rule |
| --- | --- |
| `title` | Required on create, 3–200 characters |
| `description` | Required on create, 10–5000 characters |
| `listingType` | `shortlet`, `rent`, or `sale` |
| `propertyType` | `apartment`, `house`, `duplex`, `bungalow`, `land`, `commercial`, `office`, `shop`, or `warehouse` |
| `price` | Positive number |
| `currency` | `NGN` or `USD` |
| `pricePeriod` | Shortlet: `night`; rent: `month` or `year`; sale: `total` |
| `submissionAction` | `draft` or `submit`; defaults to `submit` |
| Address | `location` or structured `streetAddress, city, state, lga, country, postalCode` |
| Map | Both `latitude` and `longitude` when coordinates are supplied |
| Size | Both `sizeValue` and `sizeUnit`; units: `sqm, sqft, acre, hectare` |
| Details | `bedrooms, bathrooms, furnishingStatus, amenities, parkingSpaces, yearBuilt` |
| Charges | `serviceCharge, securityDeposit, cleaningFee` |

Furnishing values: `unfurnished`, `semiFurnished`, and `furnished`.

Amenities:

`airConditioning, balcony, elevator, fencedCompound, garden, gym, internet,
kitchen, parking, petFriendly, powerBackup, security, swimmingPool,
washingMachine, waterSupply`.

Public property query parameters:

`listingType, propertyType, pricePeriod, currency, search, location, city,
state, lga, country, amenities, furnishingStatus, sizeUnit, minSize, maxSize,
minPrice, maxPrice, bedrooms, bathrooms, parkingSpaces, latitude, longitude,
radiusKm, sort, page, limit`.

- `amenities` can be comma-separated.
- Map search requires `latitude`, `longitude`, and `radiusKm` together.
- Maximum radius is 200 km.
- `sort`: `newest`, `priceAsc`, `priceDesc`, or `topRated`.
- Maximum page size is 100.
- Public responses intentionally omit administrator moderation fields.

### Shortlet bookings — `/api/bookings`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/availability/:propertyId` | Public | `checkInDate, checkOutDate` | Check a shortlet date range |
| GET | `/availability/:propertyId/calendar` | Public | `from, to` | Get availability calendar |
| GET | `/mine` | Authenticated | Booking filters | List the user's bookings |
| GET | `/agent` | Agent | Booking filters | List bookings for owned properties |
| GET | `/admin` | Admin | Booking filters | List platform bookings |
| POST | `/` | Authenticated | Booking body | Create a shortlet booking |
| GET | `/:bookingId` | Participant/admin | — | Get an authorized booking |
| PATCH | `/:bookingId/cancel` | Participant | `reason` | Cancel an eligible booking |
| POST | `/:bookingId/upload-receipt` | Booking customer | Multipart `receipt` | Upload payment evidence |
| PATCH | `/:bookingId/approve` | Agent/owner | — | Approve a booking |
| PATCH | `/:bookingId/reject` | Agent/owner | `reason` | Reject a booking |
| PATCH | `/:bookingId/verify-receipt` | Agent or Admin | — | Verify payment evidence |
| PATCH | `/:bookingId/reject-receipt` | Agent or Admin | `reason` | Reject payment evidence |

Booking body:

```json
{
  "property": "24-character-property-id",
  "checkInDate": "2026-09-10",
  "checkOutDate": "2026-09-14",
  "message": "Optional message"
}
```

Dates use `YYYY-MM-DD`; checkout must be after check-in. Booking filters:
`status, paymentStatus, property, page, limit`.

Receipt upload accepts one `jpg`, `jpeg`, `png`, or `pdf` file up to
5 MB.

### Inspections — `/api/inspections`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/mine` | User | `status, property, page, limit` | List customer inspections |
| GET | `/agent` | Agent | Same filters | List inspections for owned properties |
| GET | `/admin` | Admin | Same filters | List all inspections |
| POST | `/` | User | `property, requestedFor, message?` | Request an inspection |
| GET | `/:inspectionId` | Participant/admin | — | Get an authorized inspection |
| PATCH | `/:inspectionId/confirm` | Agent or Admin | — | Confirm requested time |
| PATCH | `/:inspectionId/reschedule` | Agent or Admin | `proposedFor, message?` | Propose another time |
| PATCH | `/:inspectionId/accept-reschedule` | User | — | Accept proposed time |
| PATCH | `/:inspectionId/reject` | Agent or Admin | `reason` | Reject request |
| PATCH | `/:inspectionId/cancel` | Participant | `reason` | Cancel request |
| PATCH | `/:inspectionId/complete` | Agent or Admin | — | Complete inspection |

`requestedFor` and `proposedFor` are ISO date-time values.

### Reviews — `/api/reviews`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/property/:propertyId` | Public | `rating, sort, page, limit` | List published property reviews |
| GET | `/eligibility/:propertyId` | User | — | Check whether user can review |
| GET | `/mine` | User | Review filters | List user's reviews |
| GET | `/agent` | Agent | Review filters | List reviews for owned listings |
| GET | `/admin` | Admin | Review filters | List reviews for moderation |
| POST | `/` | User | `property, rating, title?, comment` | Create an eligible review |
| PATCH | `/:reviewId` | User/owner | Any review fields | Update review |
| DELETE | `/:reviewId` | Owner/admin | — | Delete review |
| PUT | `/:reviewId/response` | Agent/owner | `comment` | Add or replace agent response |
| DELETE | `/:reviewId/response` | Agent/owner | — | Remove agent response |
| PATCH | `/:reviewId/moderate` | Admin | `status, reason?` | Publish or hide review |

Ratings are integers from 1 to 5. Review comments are 10–3000 characters.
Moderation status is `published` or `hidden`; hiding requires a reason.

### Chat — `/api/chats`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/send` | Authenticated | Message body | Start or continue conversation |
| GET | `/inbox` | Authenticated | `status, page, limit` | List conversations |
| GET | `/:conversationId` | Participant | `page, limit` | List conversation messages |
| PATCH | `/:conversationId/read` | Participant | — | Mark conversation read |
| PATCH | `/:conversationId/status` | Participant | `status` | Set `open` or `closed` |

Start a property conversation:

```json
{
  "propertyId": "24-character-property-id",
  "inquiryType": "availability",
  "content": "Is this property still available?"
}
```

Continue a conversation by sending `conversationId` and `content` instead.
Exactly one of `propertyId` or `conversationId` is required. Inquiry types:
`general, availability, viewing, price`.

### Saved properties — `/api/saved-properties`

| Method | Path | Access | Body or query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/` | Authenticated | `page, limit` | List saved properties |
| GET | `/:propertyId/status` | Authenticated | — | Check saved state |
| PUT | `/:propertyId` | Authenticated | — | Save property idempotently |
| DELETE | `/:propertyId` | Authenticated | — | Remove saved property |

### Notifications — `/api/notifications`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Authenticated | List notifications |
| GET | `/unread-count` | Authenticated | Get unread total |
| PATCH | `/:notificationId/read` | Authenticated/owner | Mark notification read |

### Users — `/api/users`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/:userId/status` | Authenticated | Return online state and last-seen time |

### Dashboard — `/api/dashboard`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/agent` | Agent | Return listing, booking, and revenue metrics |

## File-upload contract

| Upload | Field | Count | Formats | Per-file limit |
| --- | --- | --- | --- | --- |
| Property media | `images` | 1–10 on create | jpg, jpeg, png, webp | 5 MB |
| Payment receipt | `receipt` | 1 | jpg, jpeg, png, pdf | 5 MB |

Use the browser's `FormData` object and let the browser generate the multipart
boundary:

```js
const form = new FormData();
form.append("title", "Two-bedroom Lekki apartment");
form.append("listingType", "rent");
form.append("propertyType", "apartment");
form.append("price", "5000000");
form.append("pricePeriod", "year");
form.append("city", "Lekki");
form.append("state", "Lagos");
form.append("country", "Nigeria");
form.append("images", selectedFile);

await fetch(`${API_URL}/api/properties`, {
  method: "POST",
  credentials: "include",
  headers: {
    "X-CSRF-Token": csrfToken,
  },
  body: form,
});
```

Do not add a manual `Content-Type` header to this request.

## Socket.IO contract

Connect to the API origin, not the `/api` path.

Cookie authentication:

```js
const socket = io(API_URL, {
  withCredentials: true,
});
```

Bearer-style handshake:

```js
const socket = io(API_URL, {
  auth: { token: accessToken },
});
```

Server events:

| Event | Payload |
| --- | --- |
| `notification` | Notification id, type, title/body, and related booking, conversation, inspection, or review id |
| `user_online` | `{ userId }` |
| `user_offline` | `{ userId, lastSeen }` |

Chat messages are created through the REST endpoint. Socket.IO is currently
used for presence and notification delivery.

## CORS and frontend URLs

`CLIENT_URL` accepts a comma-separated list of exact origins:

```env
CLIENT_URL=http://localhost:5173,https://your-frontend.example
```

Do not include paths or trailing route names. Requests without an `Origin`
header, such as Postman and server-to-server traffic, are permitted.

For a separately hosted production frontend:

- `COOKIE_SAME_SITE=none`
- HTTPS is required because cookies are secure
- Send `credentials: "include"`
- Add the exact frontend origin to `CLIENT_URL`

## Password-reset frontend page

`PASSWORD_RESET_URL` must be the full frontend page, for example:

```env
PASSWORD_RESET_URL=https://your-frontend.example/reset-password
```

The email service adds `?token=<64-character-token>`. The frontend reads that
query value and submits:

```json
{
  "token": "token-from-query-string",
  "newPassword": "NewStrongPassword1!"
}
```

to `POST /api/auth/reset-password`.

## Current frontend-facing limitations

- There is no email-verification flow yet.
- Users cannot edit their profile through the API yet.
- There is no administrator user-management or administrator dashboard
  endpoint yet.
- Rent and sale journeys stop at discovery, chat, and inspection; they do not
  process tenancy applications, property offers, or legal transactions.
