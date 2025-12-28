const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

// Update lastActive on save
userSchema.pre('save', function(next) {
    this.lastActive = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);
