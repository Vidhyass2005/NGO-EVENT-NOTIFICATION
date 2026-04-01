// server.js — Express + Socket.io + Auto-complete cron
require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const cron       = require('node-cron');
const connectDB  = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:3000',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available on every request
app.use((req, res, next) => { req.io = io; next(); });

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);
  socket.on('register',    (userId)  => { socket.join(`user_${userId}`); console.log(`👤 User ${userId} registered`); });
  socket.on('join_event',  (eventId) => socket.join(`event_${eventId}`));
  socket.on('leave_event', (eventId) => socket.leave(`event_${eventId}`));
  socket.on('disconnect',  ()        => console.log(`🔌 Disconnected: ${socket.id}`));
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/events',        require('./routes/eventRoutes'));
app.use('/api/participation', require('./routes/participationRoutes'));
app.use('/api/certificates',  require('./routes/certificateRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard',     require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

// ─────────────────────────────────────────────────────────
// CRON JOB: Auto-complete events after their deadline
// Runs every hour at :00
// approved events with date < now → marked 'completed'
// All registered participants → marked 'attended'
// Real-time notification pushed to each participant
// Email sent to all admins
// ─────────────────────────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  try {
    const Event         = require('./models/Event');
    const Participation = require('./models/Participation');
    const Notification  = require('./models/Notification');
    const { sendAdminEventCompletedEmail } = require('./services/emailService');

    const now     = new Date();
    const expired = await Event.find({ status: 'approved', date: { $lt: now } });

    if (expired.length === 0) {
      console.log('⏰ Cron ran — no expired events');
      return;
    }

    console.log(`⏰ Cron: auto-completing ${expired.length} expired event(s)`);

    for (const event of expired) {
      // 1. Mark event completed
      event.status = 'completed';
      await event.save();

      // 2. Mark all registered participants as attended
      const parts = await Participation.find({ event: event._id, status: 'registered' });
      for (const p of parts) {
        p.status     = 'attended';
        p.attendedAt = now;
        await p.save();

        // 3. Create DB notification for participant
        const notif = await Notification.create({
          recipient:    p.user,
          title:        '🎉 Event Completed!',
          message:      `"${event.title}" has ended. Your attendance is recorded — download your certificate now!`,
          type:         'event_approved',
          relatedEvent: event._id,
        });

        // 4. Push real-time notification to participant
        io.to(`user_${p.user}`).emit('notification', notif);
      }

      // 5. Broadcast to all clients so home page refreshes
      io.emit('event_update', { type: 'event_completed', eventId: event._id });

      // 6. Email all admins
      sendAdminEventCompletedEmail(event, parts.length).catch(console.error);

      console.log(`✅ Auto-completed: "${event.title}" | ${parts.length} participant(s) marked attended`);
    }
  } catch (err) {
    console.error('❌ Cron error:', err.message);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`⏰ Auto-complete cron active — runs every hour`);
  console.log(`🌍 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});
