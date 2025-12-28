const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Login/Register user
router.post('/login',
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 20 })
            .withMessage('Username must be between 3 and 20 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username } = req.body;

            // Find or create user
            let user = await User.findOne({ username });

            if (!user) {
                user = new User({ username });
                await user.save();
            } else {
                // Update lastActive
                user.lastActive = Date.now();
                await user.save();
            }

            res.json({
                success: true,
                user: {
                    username: user.username,
                    createdAt: user.createdAt
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error during login' 
            });
        }
    }
);

// Check if username exists
router.get('/check/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        res.json({ exists: !!user });
    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
