const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
    },
    receiver: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    amount: { 
        type: Number,
        required: true 
    },
    timestamp: { 
        type: Date,
        default: Date.now 
    },
    billerName: { 
        type: String,
        required: false
    },
    types: {
        type: String,
        enum: ['TRANSFER', 'BILL_PAYMENT', 'WITHDRAWAL', 'DEPOSIT', 'ADD_MONEY_WALLET'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESSFUL', 'FAILED'],
        default: 'PENDING'
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;