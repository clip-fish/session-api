// src/index.js
const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors    = require("cors");

const PORT  = process.env.PORT  || 2000;
const HOST  = process.env.HOST  || "0.0.0.0";
const ORIGIN= process.env.CORS_ORIGIN || "*";

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ORIGIN, methods: ["GET","POST"] }
});

const sessions = {};

function makeExpressDevice(body) {
    const now = new Date().toISOString();
    return {
        id: body.id,
        userAgent: body.userAgent || body.userAgent || 'unknown',
        name: body.name,
        joinedAt: body.joinedAt || now,
        lastActiveAt: body.lastActiveAt || now,
    };
}

// ─── HTTP ROUTES ────────────────────────────────────────────────────────────────

// Create or ensure session exists
app.post('/session', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId required' });
    }
    sessions[sessionId] = sessions[sessionId] || { devices: [], messages: [] };
    return res.status(201).json({ message: 'Session ready' });
});

// Delete a session
app.delete('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (sessions[sessionId]) {
        delete sessions[sessionId];
        return res.json({ message: 'Session deleted' });
    }
    return res.status(404).json({ error: 'Session not found' });
});

// Add / update a device
app.post('/session/:sessionId/device', (req, res) => {
    const { sessionId } = req.params;
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }
    // Body should be an ExpressDevice or at least { id, name }
    const dev = makeExpressDevice(req.body);
    // upsert
    const idx = sessions[sessionId].devices.findIndex(d => d.id === dev.id);
    if (idx >= 0) sessions[sessionId].devices[idx] = dev;
    else sessions[sessionId].devices.push(dev);

    // broadcast
    io.to(sessionId).emit('deviceUpdates', sessions[sessionId].devices);
    return res.json({ message: 'Device added', device: dev });
});

// Add a message
app.post('/session/:sessionId/message', (req, res) => {
    const { sessionId } = req.params;
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }
    const msg = req.body;
    // You may want to validate shape here
    sessions[sessionId].messages.push(msg);
    io.to(sessionId).emit('messageUpdates', sessions[sessionId].messages);
    return res.json({ message: 'Message added', messageObj: msg });
});

// Fetch all devices
app.get('/session/:sessionId/devices', (req, res) => {
    const { sessionId } = req.params;
    const devices = sessions[sessionId]?.devices || [];
    return res.json({ devices });
});

// Fetch all messages
app.get('/session/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    const messages = sessions[sessionId]?.messages || [];
    return res.json({ messages });
});

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────────

io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('joinSession', sessionId => {
        socket.join(sessionId);
        const sess = sessions[sessionId];
        if (sess) {
            // send initial state
            socket.emit('deviceUpdates', sess.devices);
            socket.emit('messageUpdates', sess.messages);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ─── START SERVER ───────────────────────────────────────────────────────────────

server.listen(PORT, HOST, () => {
    console.log(`Session API listening at http://${HOST}:${PORT}`);
});
