/* E-Waste Connect API: typed procedures for posts plus secure S3-backed uploads. */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acceptEwastePost, attachCollectionEvidence, createEwastePost, getEwastePostsByOwner, getOpenEwastePosts } from "./db";
import { storagePut } from "./storage";

const deviceTypeSchema = z.enum(["laptop", "phone", "other"]);
const uploadPurposeSchema = z.enum(["device-photo", "collection-evidence"]);
const maxUploadBytes = 8 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function safeFilename(filename: string) {
  const normalized = filename.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return normalized.slice(-120) || "upload.bin";
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload data must be a base64 data URL." });
  return { contentType: match[1], bytes: Buffer.from(match[2], "base64") };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  posts: router({
    list: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(30).default(12) }).optional()).query(({ input }) => getOpenEwastePosts(input?.limit ?? 12)),
    mine: protectedProcedure.query(({ ctx }) => getEwastePostsByOwner(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      deviceType: deviceTypeSchema,
      title: z.string().trim().min(3).max(160),
      details: z.string().trim().max(4000).optional(),
      photo: z.object({ key: z.string().min(1).max(512), url: z.string().min(1).max(1024), name: z.string().max(255), mimeType: z.string().max(100), size: z.number().int().positive().max(maxUploadBytes) }).optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await createEwastePost({
          ownerId: ctx.user.id,
          deviceType: input.deviceType,
          title: input.title,
          details: input.details || null,
          photoKey: input.photo?.key,
          photoUrl: input.photo?.url,
          photoName: input.photo?.name,
          photoMimeType: input.photo?.mimeType,
          photoSize: input.photo?.size,
        });
      } catch (error) {
        console.error("[Posts] Failed to create post:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not save this device post yet." });
      }
    }),
    accept: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await acceptEwastePost(input.postId); } catch (error) {
        console.error("[Posts] Failed to accept post:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not record that handoff yet." });
      }
    }),
    attachEvidence: protectedProcedure.input(z.object({ postId: z.number().int().positive(), file: z.object({ key: z.string().min(1).max(512), url: z.string().min(1).max(1024) }) })).mutation(async ({ ctx, input }) => {
      try { return await attachCollectionEvidence(input.postId, ctx.user.id, input.file); } catch (error) {
        console.error("[Posts] Failed to attach evidence:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not attach collection evidence yet." });
      }
    }),
  }),
  files: router({
    upload: protectedProcedure.input(z.object({ filename: z.string().min(1).max(255), contentType: z.string().min(1).max(100), size: z.number().int().positive().max(maxUploadBytes), purpose: uploadPurposeSchema, dataUrl: z.string().min(32) })).mutation(async ({ ctx, input }) => {
      if (!allowedMimeTypes.has(input.contentType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a JPG, PNG, WEBP, or PDF file." });
      const decoded = decodeDataUrl(input.dataUrl);
      if (decoded.contentType !== input.contentType || decoded.bytes.length !== input.size) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload metadata did not match the file contents." });
      if (decoded.bytes.length > maxUploadBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Files must be 8 MB or smaller." });
      const key = `users/${ctx.user.id}/${input.purpose}/${crypto.randomUUID()}-${safeFilename(input.filename)}`;
      try {
        const stored = await storagePut(key, decoded.bytes, input.contentType);
        return { ...stored, name: input.filename, mimeType: input.contentType, size: decoded.bytes.length, purpose: input.purpose };
      } catch (error) {
        console.error("[Storage] Upload failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The file could not be stored. Please try again." });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
