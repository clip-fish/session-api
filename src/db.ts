// src/db.ts
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI
    ?? 'mongodb://localhost:27017/session-api';

mongoose
    .connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

export default mongoose;