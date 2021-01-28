const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");

exports.loginForm = (req, res) => {
  res.render("login", { title: "login" });
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "Register" });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody("name");
  req.checkBody("name", "You must supply a name!").notEmpty();
  req.checkBody("email", "That Email is not valid!").isEmail();
  req.sanitizeBody("email").normalizeEmail({
    remove_dots: false,
    removeExtensions: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody("password", "Password Cannot be Blank!").notEmpty();
  req
    .checkBody("password-confirm", "Confirmed Password cannot be blank!")
    .notEmpty();
  req
    .checkBody("password-confirm", "Opps! Your passwords do not match")
    .equals(req.body.password)
    .notEmpty();
  const errors = req.validationErrors();
  if (errors) {
    req.flash(
      "error",
      errors.map((err) => err.msg)
    );
    res.render("register", {
      title: "Register",
      body: req.body,
      flashes: req.flash(),
    });
    return; // stop the function from running
  }
  next(); // there were no errors. Call next middleware.
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  const registerWithPromise = promisify(User.register, User);
  await registerWithPromise(user, req.body.password);
  next();
};

exports.account = async (req, res, next) => {
  res.render("account", { title: "Edit your Account" });
};

exports.updateAccount = async (req, res, next) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    // set, to overlay the updates on top of the existing data on the user object. updates only the ones changed.
    { $set: updates },
    // new, meaning return new updated user.
    // runValidators, meaning run validations
    { new: true, runValidators: true, context: "query" }
  );
  // will send them back to the url they just came from.
  // Useful when working on multiple end points
  req.flash("success", "Update the profile!");
  res.redirect("back");
};
