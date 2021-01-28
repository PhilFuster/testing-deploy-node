const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const validator = require("validator");
const md5 = require("md5");
const mongodbErrorHandler = require("mongoose-mongodb-errors");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    unqiue: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Invalid Email Address"],
    required: "Please Supple an email address",
  },
  name: {
    type: String,
    required: "Please supply a name",
    trim: true,
  },
  hearts: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
    },
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

userSchema.virtual("gravatar").get(function () {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.statics.getHeartedStores = function () {
  return this.aggregate([
    { $unwind: "$hearts" },
    {
      $lookup: {
        from: "Store",
        localField: "_id",
      },
    },
  ]);
};

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model("User", userSchema);
