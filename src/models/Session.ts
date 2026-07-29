import mongoose, { Schema, Model } from "mongoose";

export interface ILesson {
  title: string;
  type: "audio" | "text";
  voice: string;
  duration: string;
  reason: string;
}

export interface IModule {
  phase: number;
  title: string;
  hours: number;
  topics: string[];
  description: string;
  lessons?: ILesson[];
}

export interface ISession {
  userId: string;
  topic: string;
  mode: "Goal-Based" | "Reference-Based";
  created: string;
  messages: number;
  progress: string;
  lessonsGenerated: number;
  audioFiles: number;
  textFiles: number;
  status: string;
  roadmap: IModule[];
}

const LessonSchema: Schema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["audio", "text"], default: "text" },
  voice: { type: String, default: "Self-Paced Reading" },
  duration: { type: String, default: "15m" },
  reason: { type: String, default: "Core technical reading" },
});

const ModuleSchema: Schema = new Schema({
  phase: { type: Number, required: true },
  title: { type: String, required: true },
  hours: { type: Number, default: 10 },
  topics: [{ type: String }],
  description: { type: String, required: true },
  lessons: [LessonSchema],
});

const SessionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    mode: {
      type: String,
      enum: ["Goal-Based", "Reference-Based"],
      default: "Goal-Based",
    },
    created: { type: String, required: true },
    messages: { type: Number, default: 1 },
    progress: { type: String, default: "10%" },
    lessonsGenerated: { type: Number, default: 0 },
    audioFiles: { type: Number, default: 0 },
    textFiles: { type: Number, default: 0 },
    status: {
      type: String,
      default: "Complete • Ready for Classroom",
    },
    roadmap: [ModuleSchema],
  },
  {
    timestamps: true,
  }
);

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
