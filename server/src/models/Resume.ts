import { Schema, model } from "mongoose";

// `data` is validated by zod (lib/resumeSchema.ts) before it ever reaches
// here, so the model stores it as one embedded blob rather than re-declaring
// every field a second time.
const resumeSchema = new Schema(
    {
        // Until accounts exist this is a random guest id from the browser.
        // When auth lands it becomes a real user reference.
        owner: { type: String, required: true },
        title: { type: String, required: true, default: "Untitled resume" },
        template: { type: String, required: true, default: "modern" },
        accent: { type: String, required: true, default: "#3d5a80" },
        data: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true },
);

// Every query is "this guest's resumes, newest first" or "this guest's resume
// by id". One compound index serves the list without an in-memory sort, and
// its owner prefix covers every other lookup, so no separate owner index.
resumeSchema.index({ owner: 1, updatedAt: -1 });

export const Resume = model("Resume", resumeSchema);
