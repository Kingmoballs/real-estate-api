process.env.JWT_SECRET =
    process.env.JWT_SECRET || "integration-access-token-secret";
process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET ||
    "integration-refresh-token-secret";
process.env.CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

jest.mock("../../src/shared/events/eventBus", () => ({
    on: jest.fn(),
    emit: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/modules/user/user.model");
const Property = require(
    "../../src/modules/property/property.model"
);
const {
    connectTestDatabase,
    clearTestDatabase,
    disconnectTestDatabase,
} = require("../helpers/testDatabase");

const PASSWORD = "StrongPass!123";

const createUser = (overrides = {}) =>
    User.create({
        name: "Test User",
        email: "user@example.com",
        password: PASSWORD,
        phone: "+2348012345678",
        role: "user",
        accountStatus: "active",
        ...overrides,
    });

const login = async ({ email, password = PASSWORD }) => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));

    return response.body.accessToken;
};

const authorization = (accessToken) => ({
    Authorization: `Bearer ${accessToken}`,
});

const addUtcDays = (days) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};

const createProperty = ({ agent, overrides = {} }) =>
    Property.create({
        title: "Modern Lekki Apartment",
        description:
            "A spacious, secure apartment close to major amenities.",
        location: "Lekki Phase 1, Lagos, Nigeria",
        address: {
            streetAddress: "12 Admiralty Way",
            city: "Lekki",
            state: "Lagos",
            country: "Nigeria",
        },
        images: [
            {
                url: "https://example.com/property.jpg",
                public_id: "tests/property-image",
            },
        ],
        bedrooms: 2,
        bathrooms: 2,
        listingType: "rent",
        propertyType: "apartment",
        price: 2500000,
        currency: "NGN",
        pricePeriod: "year",
        listingStatus: "draft",
        agentName: agent.name,
        agentPhone: agent.phone,
        agentEmail: agent.email,
        postedBy: agent._id,
        ...overrides,
    });

beforeAll(async () => {
    await connectTestDatabase();
}, 180000);

afterEach(async () => {
    await clearTestDatabase();
});

afterAll(async () => {
    await disconnectTestDatabase();
}, 180000);

describe("Core production workflows", () => {
    test("registers, logs in, refreshes, and logs out a user session", async () => {
        const client = request.agent(app);
        const registration = await client
            .post("/api/auth/register")
            .send({
                name: "Ada Okafor",
                email: "ada@example.com",
                password: PASSWORD,
                phone: "+2348011111111",
            });

        expect(registration.statusCode).toBe(201);
        expect(registration.body.user).toMatchObject({
            email: "ada@example.com",
            role: "user",
            accountStatus: "active",
        });

        const loginResponse = await client
            .post("/api/auth/login")
            .send({
                email: "ada@example.com",
                password: PASSWORD,
            });

        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body).toEqual(
            expect.objectContaining({
                accessToken: expect.any(String),
                csrfToken: expect.any(String),
            })
        );

        const loginCookies = loginResponse.headers["set-cookie"];
        expect(loginCookies).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/^token=.*HttpOnly/i),
                expect.stringMatching(/^refreshToken=.*HttpOnly/i),
                expect.stringMatching(/^csrfToken=/i),
            ])
        );

        const meResponse = await client.get("/api/auth/me");
        expect(meResponse.statusCode).toBe(200);
        expect(meResponse.body.user.email).toBe("ada@example.com");

        const refreshResponse = await client
            .post("/api/auth/refresh-token")
            .set("x-csrf-token", loginResponse.body.csrfToken);

        expect(refreshResponse.statusCode).toBe(200);
        expect(refreshResponse.body.accessToken).toEqual(
            expect.any(String)
        );
        expect(refreshResponse.body.csrfToken).toEqual(
            expect.any(String)
        );
        expect(refreshResponse.body.csrfToken).not.toBe(
            loginResponse.body.csrfToken
        );

        const logoutResponse = await client
            .post("/api/auth/logout")
            .set("x-csrf-token", refreshResponse.body.csrfToken);

        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.body.message).toBe(
            "Logged out successfully"
        );

        const loggedOutResponse = await client.get("/api/auth/me");
        expect(loggedOutResponse.statusCode).toBe(401);
    });

    test("promotes a regular user only after an admin approves the agent application", async () => {
        const admin = await createUser({
            name: "Platform Admin",
            email: "admin@example.com",
            phone: "+2348022222222",
            role: "admin",
        });
        await createUser({
            name: "Tola Agent",
            email: "tola@example.com",
            phone: "+2348033333333",
        });

        const [adminToken, applicantToken] = await Promise.all([
            login({ email: admin.email }),
            login({ email: "tola@example.com" }),
        ]);

        const submission = await request(app)
            .post("/api/agent-applications")
            .set(authorization(applicantToken))
            .send({
                businessType: "individual",
                businessName: "Tola Homes",
                yearsOfExperience: 5,
                serviceAreas: ["Lekki", "Victoria Island"],
                officeAddress: "18 Admiralty Way, Lekki, Lagos",
                bio: "I help clients find verified homes across Lagos with transparent guidance.",
            });

        expect(submission.statusCode).toBe(201);
        expect(submission.body.application.status).toBe("pending");

        const applicationId = submission.body.application._id;
        const pendingList = await request(app)
            .get("/api/agent-applications/admin")
            .query({ status: "pending" })
            .set(authorization(adminToken));

        expect(pendingList.statusCode).toBe(200);
        expect(pendingList.body.applications).toHaveLength(1);

        const approval = await request(app)
            .patch(
                `/api/agent-applications/admin/${applicationId}/approve`
            )
            .set(authorization(adminToken));

        expect(approval.statusCode).toBe(200);
        expect(approval.body.application).toMatchObject({
            status: "approved",
            applicant: {
                email: "tola@example.com",
                role: "agent",
            },
            reviewedBy: {
                email: "admin@example.com",
            },
        });

        const promotedSession = await request(app)
            .get("/api/auth/me")
            .set(authorization(applicantToken));

        expect(promotedSession.statusCode).toBe(200);
        expect(promotedSession.body.user.role).toBe("agent");
    });

    test("publishes an agent draft only after admin review and hides moderation fields publicly", async () => {
        const agent = await createUser({
            name: "Verified Agent",
            email: "agent@example.com",
            phone: "+2348044444444",
            role: "agent",
        });
        const admin = await createUser({
            name: "Platform Admin",
            email: "admin@example.com",
            phone: "+2348055555555",
            role: "admin",
        });
        const property = await createProperty({ agent });

        const [agentToken, adminToken] = await Promise.all([
            login({ email: agent.email }),
            login({ email: admin.email }),
        ]);

        const hiddenDraft = await request(app).get(
            `/api/properties/${property._id}`
        );
        expect(hiddenDraft.statusCode).toBe(404);

        const submission = await request(app)
            .patch(`/api/properties/${property._id}/submit-for-review`)
            .set(authorization(agentToken));

        expect(submission.statusCode).toBe(200);
        expect(submission.body.property.listingStatus).toBe(
            "pendingReview"
        );

        const approval = await request(app)
            .patch(`/api/properties/admin/${property._id}/approve`)
            .set(authorization(adminToken));

        expect(approval.statusCode).toBe(200);
        expect(approval.body.property.listingStatus).toBe("published");
        expect(approval.body.property.reviewedBy.email).toBe(
            "admin@example.com"
        );

        const publicResponse = await request(app).get(
            `/api/properties/${property._id}`
        );

        expect(publicResponse.statusCode).toBe(200);
        expect(publicResponse.body.property.listingStatus).toBe(
            "published"
        );
        expect(publicResponse.body.property).not.toHaveProperty(
            "reviewedBy"
        );
        expect(publicResponse.body.property).not.toHaveProperty(
            "reviewedAt"
        );
        expect(publicResponse.body.property).not.toHaveProperty(
            "rejectionReason"
        );
        expect(publicResponse.body.property).not.toHaveProperty(
            "submittedForReviewAt"
        );

        const publicList = await request(app).get("/api/properties");
        expect(publicList.statusCode).toBe(200);
        expect(publicList.body.properties).toHaveLength(1);
        expect(publicList.body.properties[0]).not.toHaveProperty(
            "reviewedBy"
        );
        expect(publicList.body.properties[0]).not.toHaveProperty(
            "reviewedAt"
        );
    });

    test("creates and approves a shortlet booking while rejecting overlapping dates", async () => {
        const agent = await createUser({
            name: "Shortlet Agent",
            email: "shortlet-agent@example.com",
            phone: "+2348066666666",
            role: "agent",
        });
        const firstGuest = await createUser({
            name: "First Guest",
            email: "first-guest@example.com",
            phone: "+2348077777777",
        });
        const secondGuest = await createUser({
            name: "Second Guest",
            email: "second-guest@example.com",
            phone: "+2348088888888",
        });
        const property = await createProperty({
            agent,
            overrides: {
                title: "Waterfront Shortlet",
                listingType: "shortlet",
                price: 75000,
                pricePeriod: "night",
                listingStatus: "published",
                publishedAt: new Date(),
            },
        });

        const [agentToken, firstGuestToken, secondGuestToken] =
            await Promise.all([
                login({ email: agent.email }),
                login({ email: firstGuest.email }),
                login({ email: secondGuest.email }),
            ]);

        const checkInDate = addUtcDays(30);
        const checkOutDate = addUtcDays(33);
        const overlappingCheckInDate = addUtcDays(32);
        const overlappingCheckOutDate = addUtcDays(35);

        const initialAvailability = await request(app)
            .get(`/api/bookings/availability/${property._id}`)
            .query({ checkInDate, checkOutDate });

        expect(initialAvailability.statusCode).toBe(200);
        expect(initialAvailability.body.available).toBe(true);

        const bookingResponse = await request(app)
            .post("/api/bookings")
            .set(authorization(firstGuestToken))
            .send({
                property: property._id.toString(),
                checkInDate,
                checkOutDate,
                message: "I would like to reserve this apartment.",
            });

        expect(bookingResponse.statusCode).toBe(201);
        expect(bookingResponse.body.booking).toMatchObject({
            bookingStatus: "pending",
            paymentStatus: "unpaid",
            numberOfNights: 3,
            nightlyPrice: 75000,
            totalPrice: 225000,
        });

        const overlappingBooking = await request(app)
            .post("/api/bookings")
            .set(authorization(secondGuestToken))
            .send({
                property: property._id.toString(),
                checkInDate: overlappingCheckInDate,
                checkOutDate: overlappingCheckOutDate,
            });

        expect(overlappingBooking.statusCode).toBe(409);
        expect(overlappingBooking.body.message).toBe(
            "Property is not available for the selected dates"
        );

        const bookingId = bookingResponse.body.booking._id;
        const approval = await request(app)
            .patch(`/api/bookings/${bookingId}/approve`)
            .set(authorization(agentToken));

        expect(approval.statusCode).toBe(200);
        expect(approval.body.booking.bookingStatus).toBe("approved");
        expect(approval.body.booking.paymentDueAt).toEqual(
            expect.any(String)
        );

        const blockedAvailability = await request(app)
            .get(`/api/bookings/availability/${property._id}`)
            .query({ checkInDate, checkOutDate });

        expect(blockedAvailability.statusCode).toBe(200);
        expect(blockedAvailability.body.available).toBe(false);

        const guestBookings = await request(app)
            .get("/api/bookings/mine")
            .set(authorization(firstGuestToken));

        expect(guestBookings.statusCode).toBe(200);
        expect(guestBookings.body.bookings).toHaveLength(1);
        expect(guestBookings.body.bookings[0].bookingStatus).toBe(
            "approved"
        );
    });
});
