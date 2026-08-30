const {
    getAccessCookieOptions,
    getRefreshCookieOptions,
    setAuthCookies,
    clearAuthCookies,
} = require("../../src/config/authCookies");

describe("authentication cookies", () => {
    const originalEnvironment = process.env.NODE_ENV;
    const originalSameSite = process.env.COOKIE_SAME_SITE;

    afterEach(() => {
        process.env.NODE_ENV = originalEnvironment;

        if (originalSameSite === undefined) {
            delete process.env.COOKIE_SAME_SITE;
        } else {
            process.env.COOKIE_SAME_SITE = originalSameSite;
        }
    });

    test("uses secure cross-site cookies in production", () => {
        process.env.NODE_ENV = "production";
        delete process.env.COOKIE_SAME_SITE;

        expect(getAccessCookieOptions()).toEqual(
            expect.objectContaining({
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            })
        );
        expect(getRefreshCookieOptions().path).toBe("/");
    });

    test("sets and clears every auth cookie with matching paths", () => {
        const response = {
            cookie: jest.fn(),
            clearCookie: jest.fn(),
        };

        setAuthCookies(response, {
            accessToken: "access",
            refreshToken: "refresh",
            csrfToken: "csrf",
        });
        clearAuthCookies(response);

        expect(response.cookie).toHaveBeenCalledTimes(3);
        expect(response.clearCookie).toHaveBeenCalledTimes(3);

        for (const [, options] of response.clearCookie.mock.calls) {
            expect(options.path).toBe("/");
        }
    });
});
