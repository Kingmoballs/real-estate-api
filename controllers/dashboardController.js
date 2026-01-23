const Property = require("../models/Property");
const Booking = require("../models/Booking");

exports.getAgentDashboard = async (req, res) => {
    try {
        const agentId = req.user.id;

        //Total Properties by this agent
        const totalProperties = await Property.countDocuments({ postedBy : agentId });

        //All Properties posted by this agent
        const agentProperties = await Property.find({ postedBy : agentId }).select("_id title location propertyType price");

        const propertyIds = agentProperties.map(p => p._id);

        //Total bookings from all their serviced appartments
        const totalBookings = await Booking.countDocuments({ property : { $in: propertyIds } });

        //Total  revenue from all booking
        const totalRevenueAgg = await Booking.aggregate([
            { $match: { property: { $in: propertyIds }  } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }

        ]);

        const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

        //Total messages recieved

        const totalMessages = await Message.countDocuments({ agent: agentId });

        //Detailed breakdown: Bookings and revenue per property
        const propertyStats = await Booking.aggregate([
            { $match: { property: { $in: propertyIds } } },
            { 
                $group: { 
                    _id: "$property",
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" },
                } 
            }
        ]);

        //Medge stats with property details
        const detailedBreakdown = agentProperties.map(property => {
            const stat = propertyStats.find(p => p._id.toString() === property._id.toString());
            return {
                property: property._id,
                title: property.title,
                location: property.location,
                propertyType: property.propertyType,
                price: property.price,
                bookingCount: stat ? stat.bookingCount : 0,
                totalRevenue: stat ? stat.totalRevenue : 0,
            };
        });

        res.status(200).json({
            summary: {
                totalProperties,
                totalBookings,
                totalRevenue,
                totalMessages
            },
            breakdown: detailedBreakdown
        })

    }
    catch (err) {
        res.status(500).json({message: err.message})
    }
}