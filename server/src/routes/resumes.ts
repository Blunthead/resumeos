import { Router } from "express";
import mongoose from "mongoose";
import { Resume } from "../models/Resume.js";
import { requireOwner } from "../middleware/guest.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
    resumeCreateSchema,
    resumeDataSchema,
    resumeUpdateSchema,
} from "../lib/resumeSchema.js";

const router = Router();
router.use(requireOwner);

const MAX_RESUMES = 25;

// A guest id costs nothing to mint, so the per-guest cap above doesn't stop one
// machine filling the database. This caps creation per IP instead.
const limitCreates = rateLimit(60, 60 * 60_000, "ip");

function validId(id: string | undefined): id is string {
    return !!id && mongoose.isValidObjectId(id);
}

router.get("/", async (req, res) => {
    const docs = await Resume.find({ owner: req.owner })
        .sort({ updatedAt: -1 })
        .select("title template accent updatedAt data.contact.fullName data.contact.jobTitle")
        .lean();
    res.json(docs);
});

router.post("/", limitCreates, async (req, res) => {
    const parsed = resumeCreateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid resume" });
        return;
    }
    if ((await Resume.countDocuments({ owner: req.owner })) >= MAX_RESUMES) {
        res.status(409).json({ error: `You can keep up to ${MAX_RESUMES} resumes` });
        return;
    }
    const doc = await Resume.create({
        owner: req.owner,
        title: parsed.data.title ?? "Untitled resume",
        template: parsed.data.template,
        accent: parsed.data.accent,
        data: resumeDataSchema.parse({}),
    });
    res.status(201).json(doc);
});

router.get("/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const doc = await Resume.findOne({ _id: req.params.id, owner: req.owner }).lean();
    if (!doc) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json(doc);
});

router.put("/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const parsed = resumeUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid resume" });
        return;
    }
    const doc = await Resume.findOneAndUpdate(
        { _id: req.params.id, owner: req.owner },
        { $set: parsed.data },
        { new: true, projection: { updatedAt: 1 } },
    ).lean();
    if (!doc) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json(doc);
});

router.delete("/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const result = await Resume.deleteOne({ _id: req.params.id, owner: req.owner });
    if (result.deletedCount === 0) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.status(204).end();
});

export default router;
