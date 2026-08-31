jest.mock("../../src/modules/property/property.model", () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
}));

const Property = require(
    "../../src/modules/property/property.model"
);
const propertyRepository = require(
    "../../src/modules/property/property.repository"
);

const createListQuery = (results = []) => {
    const query = {
        populate: jest.fn(),
        select: jest.fn(),
        sort: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        lean: jest.fn().mockResolvedValue(results),
    };

    for (const method of [
        "populate",
        "select",
        "sort",
        "skip",
        "limit",
    ]) {
        query[method].mockReturnValue(query);
    }

    return query;
};

describe("property repository public projection", () => {
    test("excludes moderation fields from public list queries", async () => {
        const query = createListQuery([{ title: "Public property" }]);
        Property.find.mockReturnValue(query);
        Property.countDocuments.mockResolvedValue(1);

        const result = await propertyRepository.findPaginated({
            filters: { listingStatus: "published" },
            page: 1,
            limit: 20,
            publicView: true,
        });

        expect(query.select).toHaveBeenCalledWith(
            expect.stringContaining("-reviewedBy")
        );
        expect(query.select).toHaveBeenCalledWith(
            expect.stringContaining("-reviewedAt")
        );
        expect(query.select).toHaveBeenCalledWith(
            expect.stringContaining("-submittedForReviewAt")
        );
        expect(query.populate).not.toHaveBeenCalledWith(
            "reviewedBy",
            expect.anything()
        );
        expect(result.properties).toEqual([
            { title: "Public property" },
        ]);
    });

    test("excludes moderation fields from public detail queries", () => {
        const query = {
            select: jest.fn(),
            populate: jest.fn(),
        };
        query.select.mockReturnValue(query);
        query.populate.mockReturnValue(query);
        Property.findOne.mockReturnValue(query);

        const result =
            propertyRepository.findPublicById("property-id");

        expect(Property.findOne).toHaveBeenCalledWith({
            _id: "property-id",
            listingStatus: "published",
        });
        expect(query.select).toHaveBeenCalledWith(
            expect.stringContaining("-reviewedBy")
        );
        expect(query.select).toHaveBeenCalledWith(
            expect.stringContaining("-statusChangedAt")
        );
        expect(result).toBe(query);
    });
});
