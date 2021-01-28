const mongoose = require("mongoose");
const User = mongoose.model("User");
const crypto = require("crypto");
const promisify = require("es6-promisify");
const passport = require("passport");
const mail = require("../handlers/mail");

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed Login!",
  successRedirect: "/",
  successFlash: "You are now logged in!",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Must be logged in to do that!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  // 1. see if a user with that email exists

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "No account with that email exists");
    return res.redirect("/login");
  }
  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  mail.send({
    user,
    subject: "Password Reset",
    resetURL,
    filename: "password-reset",
  });
  req.flash("success", `You have been emailed a password reset link.`);
  // 4. redirect to login page
  res.redirect("/login");
};

exports.reset = async (req, res) => {
  // 1. find a user with that reset token
  const user = await User.find({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset is invalid or expired");
    return res.redirect("/login");
  }
  res.render("reset", { title: "Reset your Password" });
};

exports.confirmedPasswords = (req, res, next) => {
  // Confirm the two passwords set in.
  // Cannot be same as old password
  if (req.body.password === req.body["password-confirm"]) {
    next(); // Keep it going
    return;
  }
  req.flash("error", "Passwords do not match!");
  res.redirect("back");
};

exports.update = async (req, res) => {
  // find user. Confirm user password reset has not expired
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset is invalid or expired");
    return res.redirect("/login");
  }
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordExpires = undefined;
  user.resetPasswordToken = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash(
    "success",
    "💃 Nice! Your password has been reset! You are now logged in!"
  );
  res.redirect("/");
};
