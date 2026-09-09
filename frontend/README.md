# Haven frontend

Responsive React frontend for Haven, a multi-segment Nigerian real-estate marketplace. It supports properties for sale, monthly or yearly rentals, and serviced shortlets, with dedicated customer, agent, and administrator experiences.

## Technology

- React 19 and React Router
- Vite and Tailwind CSS
- TanStack Query and Axios
- React Hook Form and Zod
- Leaflet, OpenStreetMap, and Geoapify
- Socket.IO client
- Vitest, Testing Library, and Playwright

## Local development

1. Install the frontend dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env` and add your browser-safe Geoapify key.

3. Start the backend API from the repository root.

4. Start the frontend:

   ```bash
   npm run dev
   ```

The defaults are `http://localhost:5000/api` for HTTP requests and `http://localhost:5000` for Socket.IO.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Complete public API base URL, including `/api` |
| `VITE_SOCKET_URL` | Backend origin used by Socket.IO, without `/api` |
| `VITE_GEOAPIFY_API_KEY` | Browser-safe key for address search and reverse geocoding |

All variables beginning with `VITE_` are included in the browser bundle. Never put a private backend secret in them. Restrict the Geoapify key to the local and deployed frontend origins in the Geoapify dashboard.

## Implemented product journeys

Public visitors can browse four featured listings, search the full marketplace, filter sale/rent/shortlet properties, use advanced amenity and radius filters, open property details, view responsive galleries, and inspect map locations.

Authenticated customers can manage saved properties and inspections, request and cancel shortlet bookings, upload payment receipts, review eligible properties, apply to become an agent, change their password, reset a forgotten password by email, and message listing agents.

Approved agents can create and edit listings with map-assisted addresses and image uploads, submit drafts for moderation, manage availability states, handle inspections and bookings, verify receipts, reply to reviews, use real-time messaging, and view dashboard metrics.

Administrators can approve or reject agent applications and property submissions, supervise bookings and inspections, verify payments, and moderate reviews.

## Error handling

- Page-render and stale lazy-chunk failures show a full recovery screen.
- Browser-offline and unreachable-API failures show a visible status banner with a retry action.
- Expected request failures remain local to their page or form and use readable feedback.

## Validation commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run ESLint across application and test code |
| `npm test` | Run Vitest unit and component tests |
| `npm run test:e2e` | Run deterministic Chromium journeys with mocked API responses |
| `npm run test:e2e:ui` | Open Playwright's interactive test runner |
| `npm run build` | Create the optimized production bundle in `dist` |
| `npm run check:deploy` | Validate production variables and warn about localhost URLs |
| `npm run check:deploy:strict` | Fail if production variables still point at localhost |

The Playwright suite mocks the browser-facing API so it is repeatable and never changes Atlas data. Backend integration tests in the repository root verify the real API and database behavior separately.

## Cloudflare deployment readiness

1. Copy `.env.production.example` to `.env.production` for a local production-build check, or add those variables in the selected hosting dashboard.
2. Set `VITE_API_BASE_URL` to the Render API URL followed by `/api`.
3. Set `VITE_SOCKET_URL` to the same Render origin without `/api`.
4. Run `npm run check:deploy:strict`, `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build`.
5. Configure the backend `CLIENT_URL` and `PASSWORD_RESET_URL` after the frontend receives its public URL.
6. Restrict the Geoapify key to the deployed frontend domain.

The frontend is configured for Cloudflare Workers Static Assets in `wrangler.jsonc`. The `single-page-application` fallback ensures that direct visits to routes such as `/properties/:propertyId` and `/account` return `index.html` instead of a host-level 404.

Use `npm run cloudflare:dry-run` to validate the compiled asset upload without publishing. `npm run deploy:cloudflare` is available for an intentional manual deployment, but the recommended workflow is Cloudflare Workers Builds connected to GitHub.
