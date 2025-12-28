const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        ref: 'User'
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster leaderboard queries
scoreSchema.index({ score: -1 });
scoreSchema.index({ username: 1, createdAt: -1 });

module.exports = mongoose.model('Score', scoreSchema);
