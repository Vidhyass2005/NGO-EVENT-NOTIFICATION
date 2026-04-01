// controllers/dashboardController.js
const Event         = require('../models/Event');
const User          = require('../models/User');
const Participation = require('../models/Participation');

const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalUsers, totalEvents, totalParticipations,
      pendingEvents, completedEvents, cancelledEvents, activeEvents,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Event.countDocuments(),
      Participation.countDocuments(),
      Event.countDocuments({ status: 'pending' }),
      Event.countDocuments({ status: 'completed' }),
      Event.countDocuments({ status: 'cancelled' }),
      Event.countDocuments({ status: 'approved', date: { $gte: now } }),
    ]);

    const recentRegistrations = await Participation.find()
      .populate('user',  'name email organization')
      .populate('event', 'title date location status')
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingApprovals = await Event.find({ status: 'pending' })
      .populate('createdBy', 'name email organization')
      .sort({ createdAt: -1 })
      .limit(10);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const participationsByMonth = await Participation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const eventsByCategory = await Event.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: '$category', count: { $sum: 1 }, participants: { $sum: '$currentParticipants' } } },
      { $sort: { count: -1 } },
    ]);

    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const topEvents = await Event.find({ status: { $in: ['approved', 'completed'] } })
      .sort({ currentParticipants: -1 })
      .limit(5)
      .select('title currentParticipants maxParticipants category date status');

    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email organization createdAt');

    res.json({
      success: true,
      stats: { totalUsers, totalEvents, totalParticipations, pendingEvents, completedEvents, cancelledEvents, activeEvents },
      recentRegistrations, pendingApprovals, participationsByMonth,
      eventsByCategory, eventsByStatus, topEvents, recentUsers,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    next(err);
  }
};

module.exports = { getDashboard };