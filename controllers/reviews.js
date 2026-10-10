const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async(req,res)=>{

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing You Requested Doesn't Exist....");
    return res.redirect("/listings");
  }
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  listing.reviews.push(newReview);
 await newReview.save();
 await listing.save();
 req.flash("success", "New Review Created!!!");
 res.redirect(`/listings/${listing._id}`);
}

module.exports.destroyReview = async(req,res)=>{
    let{id,reviewId}= req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ExpressError(404, "Review not found");
    }

    const listing = await Listing.findOneAndUpdate(
        { _id: id, reviews: reviewId },
        { $pull: { reviews: reviewId } }
    );
    if (!listing) {
        throw new ExpressError(404, "Review not found for this listing");
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!!!");
    if (!deletedReview) {
        throw new ExpressError(404, "Review not found");
    }
    res.redirect(`/listings/${id}`);
}