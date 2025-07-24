const Booking = require("../models/Booking");
const Property = require("../models/Property");

exports.createBooking = async(req, res) => {
    try{
        const { property, guestName, guestEmail, guestPhone, checkInDate, checkOutDate, message } = req.body;
        const apartment = await Property.findById(property);
        if (!apartment || apartment.propertyType !== "serviced") {
            return res.status(400). json({ error: "invalid of non-serviced apartment selected" })
        };

        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (days < 1) {
            res.status(400).json({ message: "Booking must not be less than one day" })
        }

        const totalPrice = days * apartment.dailyRate;

        const booking = new Booking({
            property,
            guestName,
            guestEmail,
            guestPhone,
            checkInDate,
            checkOutDate,
            totalPrice,
            message
        });

        const saved = await booking.save();
        res.status(201).json(saved); 
    }
    catch (err) {
        res.status(500).json({ err: err.message });
    }
    
}