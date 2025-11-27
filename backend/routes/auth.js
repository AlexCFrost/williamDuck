const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        // Fetch user info using access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const payload = await response.json();
        const { sub: googleId, email, name } = payload;

        let user = await User.findOne({ googleId });

        if (!user) {
            user = new User({ googleId, email, name });
            await user.save();
        }

        const jwtToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token: jwtToken, user });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
});

module.exports = router;
