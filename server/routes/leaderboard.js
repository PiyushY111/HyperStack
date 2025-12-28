const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Score = require('../models/Score');

// Save a new score
router.post('/save',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('score').isInt({ min: 0 }).withMessage('Score must be a positive number')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, score } = req.body;

            const newScore = new Score({
                username,
                score
            });

            await newScore.save();

            res.json({
                success: true,
                message: 'Score saved successfully',
                score: newScore
            });
        } catch (error) {
            console.error('Save score error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error saving score' 
            });
        }
    }
);

// Get leaderboard (top scores)
router.get('/top/:limit?', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 10;

        const topScores = await Score.find()
            .sort({ score: -1, createdAt: 1 })
            .limit(Math.min(limit, 100))
            .select('username score createdAt');

        res.json({
            success: true,
            leaderboard: topScores
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching leaderboard' 
        });
    }
});

// Get global leaderboard (best score per user)
router.get('/global/:limit?', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 10;

        // Aggregate to get each user's best score
        const globalLeaderboard = await Score.aggregate([
            {
                $sort: { score: -1 }
            },
            {
                $group: {
                    _id: '$username',
                    bestScore: { $first: '$score' },
                    createdAt: { $first: '$createdAt' }
                }
            },
            {
                $sort: { bestScore: -1, createdAt: 1 }
            },
            {
                $limit: Math.min(limit, 100)
            },
            {
                $project: {
                    _id: 0,
                    username: '$_id',
                    score: '$bestScore',
                    createdAt: 1
                }
            }
        ]);

        res.json({
            success: true,
            leaderboard: globalLeaderboard
        });
    } catch (error) {
        console.error('Get global leaderboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching global leaderboard' 
        });
    }
});

// Get user's personal best scores
router.get('/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const userScores = await Score.find({ username })
            .sort({ score: -1, createdAt: -1 })
            .limit(limit)
            .select('score createdAt');

        const bestScore = userScores.length > 0 ? userScores[0].score : 0;

        res.json({
            success: true,
            scores: userScores,
            bestScore
        });
    } catch (error) {
        console.error('Get user scores error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching user scores' 
        });
    }
});

// Get user's rank
router.get('/rank/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Get user's best score
        const userBestScore = await Score.findOne({ username })
            .sort({ score: -1 })
            .select('score');

        if (!userBestScore) {
            return res.json({
                success: true,
                rank: null,
                message: 'No scores found for this user'
            });
        }

        // Count how many users have a better score
        const betterScores = await Score.countDocuments({
            score: { $gt: userBestScore.score }
        });

        const rank = betterScores + 1;

        res.json({
            success: true,
            rank,
            bestScore: userBestScore.score
        });
    } catch (error) {
        console.error('Get rank error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching rank' 
        });
    }
});

module.exports = router;
