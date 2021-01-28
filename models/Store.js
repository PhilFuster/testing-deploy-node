const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");
const log = require("../logger");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Please enter a store name",
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates!",
        },
      ],
      address: {
        type: String,
        required: "You must supply an address!",
      },
    },
    photo: {
      type: String,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply an author",
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Define our Indexs
storeSchema.index({
  name: "text",
  description: "text",
});
storeSchema.index({ location: "2dsphere" });
// Sometimes more complex functions are required when working with data that will be going into your database.
// With Mongoose that is done with the 'pre' hooks as seen below.
storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop this function from running
  }
  // slug function calls toLower and then replace with - and some other stuff too.
  // important fact being the slug will be lowerCase
  this.slug = slug(this.name);
  // find other stores that have a slug of <name> or <name>-
  // Breaking down this RegExp: it is saying ->
  // Match anything that startings with this.slug.
  // Then match the literal character -
  // digit 0 - 9 0 to many time (the asterisk and the [0-9] before it) and ends with that
  // The question mark says the last part (-[0-9]) is option
  // The i as the second argument says case insensitive
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  // we essentially want say Store.find but we did not necessarily Store yet. So this question is how do we access the model inside
  //  a model function? Landed on this.constructor.find which will end up being Store by the time this is ran.
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});
/**
 * Remove any html from from title field
 */
storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); // skip it
    return;
  }
  //
  this.name = this.name.replace(/(<([^>]+)>)/gi, "");
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: "$tags" },
    // { $sortByCount: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  // by returning the aggregate like this it returns the promise
  // which allows us to await this
  return this.aggregate([
    // Lookup Stores and populate their reviews
    {
      // reviews in the from field is something mongodb does.
      // It takes the schema we have (Review) and lower cases it and adds
      // the s at the end. (In case wondering where did reviews even come from).
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews",
      },
    },
    // filter for only items that have 2 or more reviews
    {
      $match: {
        // reviews.1 is how you access items with an index in mongodb
        // so this would be reviews[1] (2nd item in array)
        // This is basically saying give me documents that have a reviews.1
        // (More than one review). Places with no reviews will be skipped.
        "reviews.1": { $exists: true },
      },
    },
    // add the average reviews field
    {
      $project: {
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: {
          $avg: "$reviews.rating",
        },
      },
    },
    // sort it by our new field, highest reviews first
    {
      $sort: {
        // -1 -> highest to lowest
        averageRating: -1,
      },
    },
    // limit to at most 10
    { $limit: 10 },
  ]);
};

// virtual cannot actually be used becuase this is a mongoose specific convenience method.
// mongodb aggregate is a lower level mongodb function and it does not know about the mongoose convenience methods
// find reviews where the stores _id property === reviews store property
storeSchema.virtual("reviews", {
  ref: "Review", // What model to link
  localField: "_id", // which field on the store?
  foreignField: "store", // which field on the review?
});

function autopopulate(next) {
  this.populate("reviews");
  next();
}

storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Store", storeSchema);
