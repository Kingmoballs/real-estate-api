const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { registerSchema, loginSchema } = require("../validators/userValidator");
const validate = require("../middleware/validateMiddleware");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

router.get("/me", protect, (req, res) => {
    res.json({ user: req.user })
})

module.exports = router;