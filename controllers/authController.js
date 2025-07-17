const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (userId)  => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
};

// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try{
        const {name, email, password, role} = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({message: "Email already in use"})
        }

        const user = await User.create({ name, email, password, role });
        const token = generateToken(user._id);
        
        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        };

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        };
        
        const token = generateToken(user._id);

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                password:user.password,
                role: user.role
            },
            token
        });

    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}