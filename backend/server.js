// server.js — Express + Socket.io + auto-complete cron
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
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET','POST'], credentials: true }
});

// Attach io to every request
app.use((req, res, next) => { req.io = io; next(); });

io.on('connection', (socket) => {
  socket.on('register',    (userId)  => socket.join(`user_${userId}`));
  socket.on('join_event',  (eventId) => socket.join(`event_${eventId}`));
  socket.on('leave_event', (eventId) => socket.leave(`event_${eventId}`));
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
app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

// ─── CRON: Auto-complete events past their date ─────────
// Runs every hour — marks 'approved' events as 'completed' after deadline
cron.schedule('0 * * * *', async () => {
  try {
    const Event        = require('./models/Event');
    const Participation= require('./models/Participation');
    const Notification = require('./models/Notification');
    const { sendAdminEventCompletedEmail } = require('./services/emailService');

    const expired = await Event.find({ status: 'approved', date: { $lt: new Date() } });
    if (expired.length === 0) return;

    console.log(`⏰ Cron: auto-completing ${expired.length} expired event(s)`);

    for (const event of expired) {
      event.status = 'completed';
      await event.save();

      // Mark all 'registered' participations as 'attended'
      const parts = await Participation.find({ event: event._id, status: 'registered' });
      for (const p of parts) {
        p.status     = 'attended';
        p.attendedAt = new Date();
        await p.save();
        const notif = await Notification.create({
          recipient: p.user, title: '🎉 Event Completed!',
          message: `"${event.title}" is completed. Download your certificate!`,
          type: 'event_approved', relatedEvent: event._id
        });
        io.to(`user_${p.user}`).emit('notification', notif);
      }

      // Broadcast to all clients so UI refreshes
      io.emit('event_update', { type: 'event_completed', eventId: event._id });

      // Email all admins
      sendAdminEventCompletedEmail(event, parts.length).catch(console.error);
      console.log(`✅ Auto-completed: "${event.title}" (${parts.length} attendees)`);
    }
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`⏰ Auto-complete cron active (runs every hour)`);
});
