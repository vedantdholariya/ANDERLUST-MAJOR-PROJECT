const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware.js");


const reviewController = require("../controllers/reviews.js")
// Create Route

// Reviews
// post review route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview)
);



//Delete Review  Route

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview
)
);

module.exports = router; 