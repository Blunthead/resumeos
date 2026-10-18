import { z } from "zod";

// One validation source for what a resume may contain. Every string is
// length-capped so a client can't stuff megabytes into a document.
const short = z.string().max(200).default("");
const long = z.string().max(5000).default("");
const id = z.string().min(1).max(64);

export const resumeDataSchema = z.object({
    contact: z
        .object({
            fullName: short,
            jobTitle: short,
            email: short,
            phone: short,
            location: short,
            website: short,
            linkedin: short,
        })
        .default({
            fullName: "",
            jobTitle: "",
            email: "",
            phone: "",
            location: "",
            website: "",
            linkedin: "",
        }),
    summary: long,
    experience: z
        .array(
            z.object({
                id,
                role: short,
                company: short,
                location: short,
                startDate: short,
                endDate: short,
                description: long,
            }),
        )
        .max(30)
        .default([]),
    education: z
        .array(
            z.object({
                id,
                degree: short,
                school: short,
                location: short,
                startDate: short,
                endDate: short,
                details: long,
            }),
        )
        .max(15)
        .default([]),
    projects: z
        .array(z.object({ id, name: short, link: short, description: long }))
        .max(20)
        .default([]),
    skills: z.array(z.string().max(60)).max(60).default([]),
    certifications: z.array(z.string().max(200)).max(30).default([]),
});

// Keep in sync with TEMPLATES in frontend/src/lib/resume.js.
export const TEMPLATE_IDS = [
    "modern",
    "classic",
    "minimal",
    "bold",
    "compact",
    "elegant",
    "executive",
    "timeline",
    "split",
    "tech",
    "academic",
    "sidebar",
    "sidebar-soft",
    "sidebar-dark",
] as const;

const accent = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const resumeUpdateSchema = z.object({
    title: z.string().trim().min(1).max(100).optional(),
    template: z.enum(TEMPLATE_IDS).optional(),
    accent: accent.optional(),
    data: resumeDataSchema.optional(),
});

export const resumeCreateSchema = z.object({
    title: z.string().trim().min(1).max(100).optional(),
    template: z.enum(TEMPLATE_IDS).default("modern"),
    accent: accent.default("#3d5a80"),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
