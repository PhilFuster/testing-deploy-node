const express = require("express");
const router = express.Router();
const storeController = require("./../controllers/storeController");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");
const reviewController = require("./../controllers/reviewController");
const { catchErrors } = require("../handlers/errorHandlers");
// Do work here

router.get("/", catchErrors(storeController.getStores));
router.get("/stores", catchErrors(storeController.getStores));
router.get("/stores/pages/:page", catchErrors(storeController.getStores));
router.get("/add", authController.isLoggedIn, storeController.addStore);

router.post(
  "/add",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post(
  "/add/:id",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get("/stores/:id/edit", catchErrors(storeController.editStore));

router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));

router.get("/tags", catchErrors(storeController.getStoresByTags));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTags));

router.get("/reverse/:name", (req, res) => {
  const reverse = [...req.params.name].reverse().join("");
  res.send(`Eurica! ${reverse}`);
});

router.get("/login", userController.loginForm);
router.post("/login", authController.login);
router.get("/register", userController.registerForm);
// 1. validate the registration data
// 2. register the user
// 3. we need to log them in
router.post(
  "/register",
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get("/logout", authController.logout);

router.get("/account", authController.isLoggedIn, userController.account);
router.post("/account", catchErrors(userController.updateAccount));
router.post("/account/forgot", catchErrors(authController.forgot));
router.get("/account/reset/:token", catchErrors(authController.reset));
router.post(
  "/account/reset/:token",
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.get("/map", storeController.mapPage);

// router.get("/hearts", catchErrors(userController.getHeartedStores));
router.get(
  "/hearts",
  authController.isLoggedIn,
  catchErrors(storeController.getHearts)
);

router.post(
  "/reviews/:id",
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);

router.get("/top", catchErrors(storeController.getTopStores));

/*
  API
*/

router.get("/api/search", catchErrors(storeController.searchStores));
router.get("/api/stores/near", catchErrors(storeController.mapStores));
router.post("/api/stores/:id/heart", catchErrors(storeController.heartStore));
module.exports = router;
