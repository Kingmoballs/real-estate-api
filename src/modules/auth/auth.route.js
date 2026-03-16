const express = require("express");
const router = express.Router();
const { register, login, refreshToken, logout } = require("./auth.controller");
const { protect } = require("@/shared/middleware/authMiddleware");
const { registerSchema, loginSchema } = require("./auth.validator");
const validate = require("@/shared/middleware/validateMiddleware");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout)

router.get("/me", protect, (req, res) => {
    res.json({ user: req.user })
})

module.exports = router;