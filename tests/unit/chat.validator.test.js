const {
    sendMessageSchema,
    conversationQuerySchema,
    updateConversationStatusSchema,
} = require("../../src/modules/chat/chat.validator");

describe("chat validation", () => {
    const propertyId = "507f1f77bcf86cd799439011";
    const conversationId = "507f191e810c19729de860ea";

    test("accepts a new property inquiry", () => {
        const { error, value } = sendMessageSchema.validate({
            propertyId,
            inquiryType: "viewing",
            content: "I would like to schedule a viewing.",
        });

        expect(error).toBeUndefined();
        expect(value.inquiryType).toBe("viewing");
    });

    test("defaults a new inquiry to general", () => {
        const { error, value } = sendMessageSchema.validate({
            propertyId,
            content: "Is this property still available?",
        });

        expect(error).toBeUndefined();
        expect(value.inquiryType).toBe("general");
    });

    test("accepts a reply to an existing conversation", () => {
        const { error } = sendMessageSchema.validate({
            conversationId,
            content: "Yes, it is still available.",
        });

        expect(error).toBeUndefined();
    });

    test("rejects property and conversation IDs together", () => {
        const { error } = sendMessageSchema.validate({
            propertyId,
            conversationId,
            content: "Hello there",
        });

        expect(error).toBeDefined();
    });

    test("rejects an invalid inquiry type", () => {
        const { error } = sendMessageSchema.validate({
            propertyId,
            inquiryType: "purchase",
            content: "I am interested in this property.",
        });

        expect(error).toBeDefined();
    });

    test("converts inbox pagination values", () => {
        const { error, value } =
            conversationQuerySchema.validate({
                page: "2",
                limit: "10",
                status: "open",
            });

        expect(error).toBeUndefined();
        expect(value.page).toBe(2);
        expect(value.limit).toBe(10);
    });

    test("allows only open or closed conversation states", () => {
        const valid = updateConversationStatusSchema.validate({
            status: "closed",
        });

        const invalid = updateConversationStatusSchema.validate({
            status: "deleted",
        });

        expect(valid.error).toBeUndefined();
        expect(invalid.error).toBeDefined();
    });
});
