import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  handler: async (ctx) => {
    const comments = await ctx.db.query("comments").order("desc").collect();
    return Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          _id: comment._id,
          _creationTime: comment._creationTime,
          body: comment.body,
          userId: comment.userId,
          author: user?.name ?? "Anonymous",
          image: user?.image,
          twitterHandle: user?.twitterHandle,
          note: comment.note,
        };
      }),
    );
  },
});

export const add = mutation({
  args: {
    body: v.string(),
  },
  returns: v.union(
    v.object({ ok: v.literal(true) }),
    v.object({ ok: v.literal(false), error: v.string() }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("comments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (recent && recent._creationTime > oneWeekAgo) {
      return { ok: false as const, error: "You can only post one comment per week." };
    }

    await ctx.db.insert("comments", {
      userId,
      body: args.body,
    });
    return { ok: true as const };
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
  },
});
