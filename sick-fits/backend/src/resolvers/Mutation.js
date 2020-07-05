const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: { ...args },
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
    const item = await ctx.db.query.item({ where }, `{id, title}`);
    // 2. check if they own that item, or have the permissions
    // TODO
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
};

module.exports = Mutations;
