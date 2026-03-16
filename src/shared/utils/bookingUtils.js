exports.shouldActivateBooking = (checkInDate) => {
    const today = new Date().toISOString().split("T")[0];
    return checkInDate <= today;
};
