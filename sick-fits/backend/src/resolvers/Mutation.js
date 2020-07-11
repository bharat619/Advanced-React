const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");
const { hasPermission } = require("../utils");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that!");
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // This is how we create a relationship between item and user
          user: {
            connect: {
              id: ctx.request.userId,
            },
          },
          ...args,
        },
      },
      info
    );

    return item;
  },

  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the id from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find item
    const item = await ctx.db.query.item({ where }, `{id, title, user { id }}`);
    // 2. check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermission = ctx.request.user.permissions.some((permission) =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );

    if (!ownsItem && !hasPermission) {
      throw new Error("You dont have permission to do that");
    }
    // 3. delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash their password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] },
        },
      },
      info
    );
    // create the JWT token for the user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // set the jwt as cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // Finallyyyyyy we return user to the browser
    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    // 1.check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. check if the password is corrent
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password");
    }
    // 3. generate jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    console.log(token);
    // 4. set cookie with token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. return user
    return user;
  },

  async signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token", "expires", {
      maxAge: 0,
    });
    return true;
  },

  async requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({
      where: {
        email: args.email,
      },
    });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // 2. set a reset token and an expiry
    const randomBytesPrmosisified = promisify(randomBytes);
    const resetToken = (await randomBytesPrmosisified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // q hour from now
    const res = await ctx.db.mutation.updateUser({
      where: {
        email: args.email,
      },
      data: { resetToken, resetTokenExpiry },
    });
    // 3. Email them that reset token
    const mailRes = await transport.sendMail({
      from: "baru.hegde@gmail.com",
      to: user.email,
      subject: "Your password reset token",
      html: makeANiceEmail(
        `Your Password reset token is here! \n \n <a href="${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}"> Click here to reset!!</a>`
      ),
    });

    // 4. Return the message
    return { message: "thanks" };
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if passwords match
    const { password, confirmPassword, resetToken } = args;
    if (password !== confirmPassword) {
      throw new Error("Dang!! The passwords dont match.");
    }
    // 2. check if its a legit reset token
    // 3. check if its expired
    let [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error("Dang!! Thats an invalid token");
    }

    // 4. Hash their new password
    const newPassword = await bcrypt.hash(password, 10);
    // 5. Save  the new password to the user and remove old reset token fields
    user = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: { password: newPassword, resetToken: null, resetTokenExpiry: null },
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 7. Set the JWT token

    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 8. return the new user
    return user;
  },

  async updatePermissions(parent, args, ctx, info) {
    // 1. check if logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in");
    }
    // 2. query current user
    const currentUser = ctx.request.user;
    // 3. check if they have permissions to do this
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);
    // 4. update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          // this is how we set the enum in the relationship
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          id: args.userId,
        },
      },
      info
    );
  },

  async addToCart(parent, args, ctx, info) {
    // 1. Make sure they are signed in
    const userId = ctx.request.userId;
    if (!userId) {
      throw new Error("You must be signed in..!!");
    }
    // 2. Query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    });
    // 3. Check if that item is already in their cart and increment by 1 if it is
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          where: {
            id: existingCartItem.id,
          },
          data: { quantity: existingCartItem.quantity + 1 },
        },
        info
      );
    }
    // 4. If its not, create a fresh cart item for that user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },

  async removeFromCart(parent, args, ctx, info) {
    const userId = ctx.request.userId;
    if (!userId) {
      throw new Error("You need to be logged in for that...!");
    }
    // 1. Find the cart item
    // 2. Make sure they own cart item
    const [cartItem] = await ctx.db.query.cartItems({
      where: {
        id: args.id,
        user: {
          id: userId,
        },
      },
    });
    if (!cartItem) throw new Error("No CartItem Found!!");
    // 3. Delete that cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: cartItem.id,
        },
      },
      info
    );
  },
};

module.exports = Mutations;
