// src/index.ts
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

import "./db";
import SessionModel, { IDevice, IMessage } from "./models/Session";

const PORT: number = parseInt(process.env.PORT || "2000", 10);
const HOST: string = process.env.HOST || "0.0.0.0";
const ORIGIN: string = process.env.CORS_ORIGIN || "*";

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ORIGIN, methods: ["GET", "POST"] }
});

interface ExpressDeviceBody {
    id: string;
    userAgent?: string;
    name?: string;
    joinedAt?: string;
    lastActiveAt?: string;
}

function makeExpressDevice(body: ExpressDeviceBody): IDevice {
    const now = new Date();
    return {
        id: body.id,
        userAgent: body.userAgent ?? "unknown",
        name: body.name,
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : now,
        lastActiveAt: body.lastActiveAt ? new Date(body.lastActiveAt) : now,
    };
}

// ─── HTTP ROUTES ────────────────────────────────────────────────────────────────

// Create or ensure session exists
app.post(
    '/session',
    async (req, res): Promise<void> => {
        const { sessionId } = req.body as { sessionId?: string };
        if (!sessionId) {
            res.status(400).json({ error: 'sessionId required' });
            return;
        }

        await SessionModel.findOneAndUpdate(
            { sessionId },
            { $setOnInsert: { sessionId } },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Session ready' });
    }
);

// Delete a session
app.delete(
    "/session/:sessionId",
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;
        const result = await SessionModel.findOneAndDelete({ sessionId });
        if (result) {
            res.json({ message: "Session deleted" });
        } else {
            res.status(404).json({error: "Session not found"});
        }
    }
);

// Add / update a device
app.post(
    "/session/:sessionId/device",
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;
        const session = await SessionModel.findOne({ sessionId });
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        const dev = makeExpressDevice(req.body);
        session.devices = session.devices.filter(d => d.id !== dev.id);
        session.devices.push(dev);
        await session.save();

        io.to(sessionId).emit("deviceUpdates", session.devices);
        res.json({ message: "Device added", device: dev });
    }
);

// Add a message
app.post(
    "/session/:sessionId/message",
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;
        const session = await SessionModel.findOne({ sessionId });
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        const msg: IMessage = req.body;
        session.messages.push(msg);
        await session.save();

        io.to(sessionId).emit("messageUpdates", session.messages);
        res.json({ message: "Message added", messageObj: msg });
    }
);

// Fetch all devices
app.get(
    "/session/:sessionId/devices",
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;
        const session = await SessionModel.findOne({ sessionId });
        const devices = session?.devices ?? [];
        res.json({ devices });
    }
);

// Fetch all messages
app.get(
    "/session/:sessionId/messages",
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;
        const session = await SessionModel.findOne({ sessionId });
        const messages = session?.messages ?? [];
        res.json({ messages });
    }
);

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────────

io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinSession", async (sessionId: string) => {
        socket.join(sessionId);
        const sess = await SessionModel.findOne({ sessionId });
        if (sess) {
            socket.emit("deviceUpdates", sess.devices);
            socket.emit("messageUpdates", sess.messages);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// ─── START SERVER ───────────────────────────────────────────────────────────────

server.listen(PORT, HOST, () => {
    console.log(`Session API listening at http://${HOST}:${PORT}`);
});
