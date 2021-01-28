const mongoose = require("mongoose");
const Review = mongoose.model("Review");
const uuid = require("uuid");
const User = require("../models/User");

exports.addReview = async (req, res) => {
  const { id: storeId } = req.params;
  req.body.author = req.user._id;
  req.body.store = storeId;
  const newReview = await new Review(req.body).save();

  req.flash("Success", `Review submitted.`);
  res.redirect("back");
};
