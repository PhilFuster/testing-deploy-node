const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");
const User = require("../models/User");
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed" }, false);
    }
  },
};
exports.homePage = (req, res) => {
  res.render("index");
};
exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};
// stores in memory
exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // Check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully Created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const { slug } = req.params;

  const store = await Store.findOne({ slug }).populate("author reviews");
  // If there's no store then return next and let the next middleware handle it
  if (!store) return next();

  res.render("store", { title: store.name, store });
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;
  // 1. Query the database for a list of all stores
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: "desc" });

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);

  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash(
      "info",
      `Page ${page} does not exist. Redirected to page ${pages}`
    );
    res.redirect(`/stores/pages/${pages}`);
    return;
  }
  res.render("stores", { title: "Stores", stores, pages, page, count });
};
const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error("You must own a store in order to edit it!");
  }
  return true;
};

const removeHTMLFromString = (string) => {
  return string.replace(/(<([^>]+)>)/gi, "");
};
exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm they are the owner of the store
  confirmOwner(store, req.user);
  // 3. Render out the edit form so the user can update their store
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // Set type of location to point
  req.body.location.type = "Point";
  // sanitize store name of any html
  req.body.name = removeHTMLFromString(req.body.name);
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true,
  }).exec();
  req.flash(
    "success",
    `Sucessfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store -></a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  // redirect them to the store and tell them it worked
};

exports.getStoresByTags = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render("tags", { tags, title: "Tags", tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    // first find stores that match
    {
      $text: {
        $search: req.query.q,
      },
    },
    {
      score: { $meta: "textScore" },
    }
  )
    // Sort them by score
    .sort({
      score: { $meta: "textScore" },
    })
    // Limit to only 5 results
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 10000, // 10 km
      },
    },
  };
  const stores = await Store.find(q)
    .select("slug name description location photo")
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render("map", { title: "Map" });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map((obj) => obj.toString());
  const operator = hearts.includes(req.params.id) ? `$pull` : "$addToSet";
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};

// My version of the end point
// exports.getHeartedStores = async (req, res) => {
//   // const heartedStores = await User.getHeartedStores();
//   const heartedStores = await User.findOne({ _id: req.user.id }).populate({
//     path: "hearts",
//     model: "Store",
//     populate: {
//       path: "author",
//       model: "User",
//       select: "-hearts",
//     },
//   });
//   // res.json(heartedStores.hearts);
//   res.render("hearts", {
//     title: "Hearted Stores",
//     stores: heartedStores.hearts,
//   });
// };

// Wes' version
exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts },
  });

  res.render("stores", { title: "Hearts", stores });
};

// Whenever you need to perform a complex query it is best to
// keep that code/function on the model rather than in the controller

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  // res.render("topStores", { stores, title: "★ Top Stores!" });
  res.render("topStores", { stores, title: "Top Stores" });
};
