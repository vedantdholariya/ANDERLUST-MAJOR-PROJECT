const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req,res,next)=>{
     if(!req.isAuthenticated()){
        req.session.redirectUrl = req.method === "GET"
            ? req.originalUrl
            : (req.params.id ? `/listings/${req.params.id}` : "/listings");
        req.flash("error","You must be logged in to do that.");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing You Requested Doesn't Exist....");
            return res.redirect("/listings");
        }

        if (!listing.owner || !listing.owner.equals(req.user._id)) {
            req.flash("error", "You are not the owner of the Listing . You don't have permission to edit or delete this listing.");
            return res.redirect(`/listings/${id}`);
        }

        res.locals.listing = listing;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);

        if (!review) {
            req.flash("error", "Review not found.");
            return res.redirect(`/listings/${req.params.id}`);
        }

        if (!review.author || !review.author.equals(req.user._id)) {
            req.flash("error", "You don't have permission to delete this review.");
            return res.redirect(`/listings/${req.params.id}`);
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.validateReview = (req,res,next) =>{
    let{error} = reviewSchema.validate(req.body);

    if(error){
        let errMsg = error.details.map((el) =>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};