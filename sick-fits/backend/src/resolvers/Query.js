const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils");

const Query = {
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  async me(parent, args, ctx, info) {
    // check if there is a current user id
    if (!ctx.request.userId) {
      return null;
    }
    const user = await ctx.db.query.user(
      { where: { id: ctx.request.userId } },
      info
    );
    console.log(user);
    return user;
  },
  async users(parent, args, ctx, info) {
    // 1. Check if logged in
    if (!ctx.request.userId) {
      throw new Error("You need to be logged in for that!");
    }
    // 2. check if the user has permission to query all the users
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);

    // 3. If they do, query all the users
    return ctx.db.query.users({}, info);
  },
};

module.exports = Query;
