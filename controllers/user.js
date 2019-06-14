const nodemailer = require("nodemailer");
const User = require("../models/user");
const mailgun = require("mailgun-js");
const path = require("path");
const sendWeeklyEmail = require("./emailFunction");
const fs = require("fs");
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

async function unsubscribeUser(req, res, next) {
  try {
    await User.deleteOne({ email: req.params.email });
    req.flash(
      "success",
      "You successfully unsubscribed from DevAlert NewsLetter"
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    next(err);
  }
}

async function sendMail(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      console.log(user);
      req.flash("emailError", "Email already subscribed");
      return res.redirect("/");
    }
    //if email doesn't exist
    await User.create(req.body);

    const filename = path.normalize(
      path.join(__dirname, "../email-templates/welcome.hbs")
    );
    const html = fs
      .readFileSync(filename)
      .toString()
      .replace(/{{email}}/, email);
    const data = {
      from: "Devalert <noreply@devalert.com>",
      to: email,
      subject: "Devalert Subscription",
      html
    };
    const body = await mg.messages().send(data);

    req.flash("success", "Email subscription was successful");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    next(err);
  }
}


async function sendMailForRemoteJob() {
  try {
    var presentTime = Date.now();
    var aWeekAgo = presentTime - 604800000;
    var date = new Date(aWeekAgo).toISOString().split('T')[0];
    var foundJobs = await db.find({ created_date: { $gt: date } });

    sendWeeklyEmail(foundJobs);

  } catch (error) {
    console.log(error);
  }
}
// fire the email automatically
sendMailForRemoteJob()


async function sendContactAlert(req, res, next) {
  try {
    const { email, name, subject, message } = req.body;
    const filename = path.normalize(
      path.join(__dirname, "../email-templates/contact.hbs")
    );
    const html = fs
      .readFileSync(filename)
      .toString()
      .replace(/{{name}}/, name);
    const data = {
      from: "Devalert <supports@devalert.com>",
      to: email,
      subject: "Contact Us - DevAlert",
      html
    };
    const body = await mg.messages().send(data);

    req.flash(
      "success",
      "Your message was sent. Our support would reply within 24 hours."
    );
    res.redirect("/contact");
  } catch (err) {
    console.error(err);
    next(err);
  }
}

module.exports = {
  unsubscribeUser,
  sendMail,
  sendMailForRemoteJob,
  sendContactAlert
};
