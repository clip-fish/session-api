// src/models/Session.ts

import { Schema, model, Document } from 'mongoose';

export interface IDevice {
    id: string;
    userAgent: string;
    name?: string;
    joinedAt: Date;
    lastActiveAt: Date;
}

export enum MessageStatusType {
    LOADING = "loading",
    LOADED  = "loaded",
    ERROR   = "error",
}

export interface IMessageStatus {
    type: MessageStatusType;
    progress?: number;
    error?: string;
}

export interface IMessage {
    id:         string;
    type:       string;
    sender:     string;
    senderName: string;
    sentAt:     Date;
    status:     IMessageStatus;
    text?:      string;
    filename?:  string;
    fileSize?:  number;
}

export interface ISession extends Document {
    sessionId: string;
    devices: IDevice[];
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
    {
        id:           { type: String, required: true },
        userAgent:    { type: String, default: 'unknown' },
        name:         { type: String },
        joinedAt:     { type: Date,   default: () => new Date() },
        lastActiveAt: { type: Date,   default: () => new Date() },
    },
    { _id: false }
);

const StatusSchema = new Schema<IMessageStatus>(
    {
        type:     { type: String, enum: Object.values(MessageStatusType), required: true },
        progress: { type: Number },   // present only if type === “loading”
        error:    { type: String },   // present only if type === “error”
    },
    { _id: false }
);

const MessageSchema = new Schema<IMessage>(
    {
        id:         { type: String },
        type:       { type: String, required: true },
        sender:     { type: String, required: true },
        senderName: { type: String, required: true },
        sentAt:     { type: Date,   default: () => new Date() },
        status:     { type: StatusSchema, required: true },

        text:      { type: String },
        filename:  { type: String },
        fileSize:  { type: Number },
    },
    { _id: false }
);

const SessionSchema = new Schema<ISession>(
    {
        sessionId: { type: String, required: true, unique: true },
        devices:   { type: [DeviceSchema], default: [] },
        messages:  { type: [MessageSchema], default: [] },
    },
    {
        timestamps: true,  // adds createdAt & updatedAt as Date
        toJSON: {
            virtuals: true,
            transform(_, ret) {
                // convert Date → ISO string (so your client sees strings)
                ret.createdAt   = ret.createdAt.toISOString();
                ret.updatedAt   = ret.updatedAt.toISOString();
                ret.devices     = ret.devices.map((d: any) => ({
                    ...d,
                    joinedAt:     d.joinedAt.toISOString(),
                    lastActiveAt: d.lastActiveAt.toISOString()
                }));
                ret.messages    = ret.messages.map((m: any) => ({
                    ...m,
                    sentAt: m.sentAt.toISOString()
                }));
                return ret;
            }
        }
    }
);

export default model<ISession>('Session', SessionSchema);
