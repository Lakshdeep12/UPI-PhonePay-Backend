const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Transaction = require('../models/transactions');

const addMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user._id;

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.balance += amount;
        await user.save();
        const transaction = await Transaction.create({
            sender: userId,
            receiver: userId,
            amount,
            types: 'ADD_MONEY_WALLET',
            status: 'SUCCESSFUL'
        });

        return res.json({ message: 'Money added successfully', balance: user.balance });
    } catch (error) {
        console.error('Error adding money:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const paybill = async (req, res) => {
    try {
        const { amount, recipientUpiId, mpin } = req.body;
        const userId = req.user._id;

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else if (!user.mpin) {
            return res.status(400).json({ message: 'MPIN not set. Please set your MPIN before making payments.' });
        } else if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }
        const isMpinValid = await bcrypt.compare(mpin, user.mpin);
        if (!isMpinValid) {
            return res.status(401).json({ message: 'Invalid MPIN' });
        }
        const recipient = await User.findOne({ upiId: recipientUpiId });
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }   
        user.balance -= amount;
        recipient.balance += amount;    
        await user.save();
        await recipient.save();
        const transaction = await Transaction.create({
            sender: user._id,
            receiver: recipient._id,
            amount,
            types: 'BILL_PAYMENT',
            status: 'SUCCESSFUL'
        });
        return res.json({ message: 'Payment successful', balance: user.balance });
    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
    addMoney,
    paybill
};