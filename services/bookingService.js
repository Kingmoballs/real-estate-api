const mongoose = require("mongoose");
const bookingRepository = require("../repositories/bookingRepository");
const propertyRepository = require("../repositories/propertyRepository");
const NotificationService = require("./notificationService");
const { acquireLock, releaseLock } = require("../utils/redisLock");
const ApiError = require("../utils/ApiError");

exports.createBooking = async ({ user, payload }) => {
  const session = await mongoose.startSession();
  let lockToken;

  const { property, checkInDate, checkOutDate } = payload;
  const lockKey = `booking:${property}:${checkInDate}:${checkOutDate}`;

  try {
    // Acquire Redis lock
    lockToken = await acquireLock(lockKey);

    // Start DB transaction
    session.startTransaction();

    const apartment = await propertyRepository.findById(property);
    if (!apartment || apartment.propertyType !== "serviced") {
      throw new ApiError(400, "Invalid or non-serviced apartment selected");
    }

    const start = new Date(`${checkInDate}T00:00:00.000Z`);
    const end = new Date(`${checkOutDate}T00:00:00.000Z`);

    if (isNaN(start) || isNaN(end) || end <= start) {
      throw new ApiError(400, "Invalid booking dates");
    }

    const conflict = await bookingRepository.findConflictingBooking({
      property,
      start,
      end,
      session
    });

    if (conflict) {
      throw new ApiError(409, "Apartment already booked for selected dates");
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const booking = await bookingRepository.create(
      {
        property,
        guest: user._id,
        guestName: user.name,
        guestEmail: user.email,
        guestPhone: user.phone,
        checkInDate: start,
        checkOutDate: end,
        totalPrice: days * apartment.dailyRate,
        bookingStatus: "pending",
        paymentStatus: "unpaid"
      },
      session
    );

    await session.commitTransaction();
    session.endSession();

    await releaseLock(lockKey, lockToken);

    NotificationService.createBookingNotification({
      agentId: apartment.postedBy,
      guestName: user.name
    })
    .then(NotificationService.emitBookingNotification)
    .catch(err => {
      console.error("Notification failed:", err.message);
    });

    return booking;

  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    if (lockToken) {
      await releaseLock(lockKey, lockToken);
    }

    throw err;
  }
};

exports.approveBooking = async ({ bookingId, agent }) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await bookingRepository.findByIdWithProperty(
      bookingId,
      session
    );

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    // Authorization: only property owner can approve
    if (booking.property.postedBy.toString() !== agent._id.toString()) {
      throw new ApiError(403, "You are not authorized to approve this booking");
    }

    if (booking.bookingStatus !== "pending") {
      throw new ApiError(
        400,
        `Booking cannot be approved. Current status: ${booking.bookingStatus}`
      );
    }

    await bookingRepository.updateStatus(
      booking,
      "approved",
      session
    );

    await session.commitTransaction();
    session.endSession();

    // notification
    NotificationService.createBookingApprovalNotification({
      guestId: booking.guest,
    })
      .then(NotificationService.emitBookingNotification)
      .catch(err =>
        console.error("Approval notification failed:", err.message)
      );

    return booking;

  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    throw err;
  }
}