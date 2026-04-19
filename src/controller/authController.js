const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is NOT defined');
        throw new Error('JWT_SECRET is not defined');
    }
    console.log('Generating token with JWT_SECRET:', process.env.JWT_SECRET.substring(0, 10) + '...');
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sanitizedname = email.toLowerCase();
        const upiID = `${sanitizedname.split('@')[0]}@phonepay`;

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            upiId: upiID,
        });

        await newUser.save();

        return res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            upiId: newUser.upiId,
            balance: newUser.balance,
            hasMpinSet: false,
            token: generateToken(newUser._id),
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!password || (!email && !phone)) {
            return res.status(400).json({ message: 'Email or phone and password are required' });
        }

        const identifier = email || phone;
        const isEmail = identifier.includes('@');
        const query = isEmail ? { email: identifier } : { phone: parseInt(identifier) || identifier };

        const user = await User.findOne(query);

        if (user && (await bcrypt.compare(password, user.password))) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                upiId: user.upiId,
                balance: user.balance,
                hasMpinSet: !!user.mpin,
                token: generateToken(user._id),
            });
        }

        return res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const setupMpin = async (req, res) => {
    try {
        const { mpin } = req.body;

        if (!mpin || mpin.length !== 4) {
            return res.status(400).json({ message: 'MPIN must be 4 digits' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedMpin = await bcrypt.hash(mpin, salt);

        req.user.mpin = hashedMpin;
        await req.user.save();

        return res.json({ message: 'MPIN set successfully' });
    } catch (error) {
        console.error('Error setting MPIN:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -mpin');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            upiId: user.upiId,
            balance: user.balance,
            hasMpinSet: !!user.mpin,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    setupMpin,
    getUserProfile,
};