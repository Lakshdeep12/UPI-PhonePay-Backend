const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    console.log('Protect middleware called');
    console.log('Authorization header:', req.headers.authorization);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token extracted:', token ? token.substring(0, 20) + '...' : 'null');
            
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is NOT defined in protect middleware');
                return res.status(401).json({ message: 'Server configuration error: JWT_SECRET not set' });
            }
            console.log('JWT_SECRET available:', process.env.JWT_SECRET.substring(0, 10) + '...');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully, user ID:', decoded.id);
            
            req.user = await User.findById(decoded.id).select('-password');
            console.log('User found in DB:', !!req.user);
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found in database' });
            }
            
            console.log('Auth passed for user:', req.user.email);
            return next();
        } catch (error) {
            console.error('JWT verification error:', error.message);
            return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
        }
    }

    console.log('No valid Authorization header found');
    res.status(401).json({ 
        message: 'Not authorized. Please provide Authorization header with Bearer token',
        example: 'Authorization: Bearer <your_token>'
    });
};

module.exports = { protect };