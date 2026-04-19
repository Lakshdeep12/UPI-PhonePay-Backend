const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/transactions');

const sendMoney = async (req, res) => {
    try {
        const { phone, amount, mpin} = req.body;
        const senderId = req.user._id;
        if(!mpin){
            return res.status(400).json({ message: 'MPIN is required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: 'Sender not found' });
        } 
        const isMpinValid = await bcrypt.compare(mpin, sender.mpin);
        if (!isMpinValid) {
            return res.status(401).json({ message: 'Invalid MPIN' });
        }
        const receiver = await User.findOne({ phone });
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        if (sender.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }
        sender.balance -= amount;
        receiver.balance += amount;
        await sender.save();
        await receiver.save();
        const transaction = await Transaction.create({
            sender: sender._id,
            receiver: receiver._id,
            amount,
            types: 'TRANSFER',
            status: 'SUCCESSFUL'
        });
        return res.json({ message: 'Money sent successfully', transaction });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const transactions = await Transaction.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).populate('sender', 'name phone').populate('receiver', 'name phone').sort({ timestamp: -1 });
        return res.json({ transactions });
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports = {
    sendMoney,
    getTransactionHistory
};