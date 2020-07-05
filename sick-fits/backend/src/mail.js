const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "59f1e66b56fb8f",
    pass: "98d521929f9432",
  },
});

const makeANiceEmail = (text) => `
  <div className="email"
  style="border: 1px solid black;
  padding: 20px;
  font-familty: sans-seriff;
  line-height: 2;
  font-size: 20px;">
    <h2>Hello There!</h2>
    <p>${text}</p>

    <p>😘, Bharat</p>
  </div>
`;

exports.transport = transport;
exports.makeANiceEmail = makeANiceEmail;
