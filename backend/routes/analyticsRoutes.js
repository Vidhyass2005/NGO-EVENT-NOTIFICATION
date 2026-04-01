const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Event         = require('../models/Event');
const Participation = require('../models/Participation');

router.get('/stats', protect, async (req, res, next) => {
  try {
    const [totalEvents, totalParticipants, completedEvents, categories, monthly, topEvents] = await Promise.all([
      Event.countDocuments(),
      Participation.countDocuments(),
      Event.countDocuments({ status: 'completed' }),

      Event.aggregate([
        { $match: { status: { $in: ['approved', 'completed'] } } },
        { $group: { _id: '$category', count: { $sum: 1 }, participants: { $sum: '$currentParticipants' } } },
        { $sort: { count: -1 } },
      ]),

      Participation.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, participants: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),

      Event.find({ status: { $in: ['approved', 'completed'] } })
        .sort({ currentParticipants: -1 })
        .limit(5)
        .select('title currentParticipants maxParticipants category'),
    ]);

    res.json({
      success: true,
      overview: {
        totalEvents,
        totalParticipants,
        completedEvents,
        completionRate: totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0,
      },
      categories,
      monthly,
      topEvents,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;