import { Schema, model } from "mongoose";

// `data` is validated by zod (lib/resumeSchema.ts) before it ever reaches
// here, so the model stores it as one embedded blob rather than re-declaring
// every field a second time.
const resumeSchema = new Schema(
    {
        // Until accounts exist this is a random guest id from the browser.
        // When auth lands it becomes a real user reference.
        owner: { type: String, required: true, index: true },
        title: { type: String, required: true, default: "Untitled resume" },
        template: { type: String, required: true, default: "modern" },
        accent: { type: String, required: true, default: "#3d5a80" },
        data: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true },
);

export const Resume = model("Resume", resumeSchema);
