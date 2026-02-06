import Twitter from "@auth/core/providers/twitter";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Twitter({
      profile({ data }) {
        return {
          id: data.id,
          name: data.name,
          email: data.email ?? null,
          image: data.profile_image_url,
          twitterHandle: data.username,
        };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, ...args }) {
      const { emailVerified, phoneVerified, ...profile } = args.profile;
      // Strip null values — Twitter returns email: null
      const userData = Object.fromEntries(
        Object.entries(profile).filter(([, v]) => v != null),
      );
      if (existingUserId) {
        await ctx.db.patch(existingUserId, userData);
        return existingUserId;
      }
      return await ctx.db.insert("users", userData);
    },
  },
});
