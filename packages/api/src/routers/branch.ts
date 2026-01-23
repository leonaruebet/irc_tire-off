/**
 * Branch router
 * Handles branch listing for the application
 */

import { create_router, public_procedure } from "../trpc";

export const branch_router = create_router({
  /**
   * List all active branches
   */
  list: public_procedure.query(async ({ ctx }) => {
    console.log("[Branch] List branches");

    const branches = await ctx.db.branch.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        phone: true,
      },
    });

    console.log("[Branch] List branches completed", { count: branches.length });

    return branches;
  }),
});
