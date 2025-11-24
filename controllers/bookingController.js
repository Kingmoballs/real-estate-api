const Booking = require("../models/Booking");
const Property = require("../models/Property");

exports.createBooking = async(req, res) => {
    try{
        const { property, checkInDate, checkOutDate, message } = req.body;

        const apartment = await Property.findById(property);
        if (!apartment || apartment.propertyType !== "serviced") {
            return res.status(400). json({ error: "invalid of non-serviced apartment selected" })
        };

        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: "is not a valid format" })
        }

        if (end <= start) {
            return res.status(400).json({ message: "check-out date must be after check-in date" })
        }

        // Calculate stay duration
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const days = Math.ceil((end - start) / MS_PER_DAY);

        if (days < 1) {
            return res.status(400).json({ message: "booking must be at least one day" })
        }

        const totalPrice = days * apartment.dailyRate;

        const booking = new Booking({
            property,
            guestName: req.user.name,
            guestEmail: req.user.email,
            guestPhone: req.user.phone,
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