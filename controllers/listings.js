const Listing = require("../models/listing")
const ExpressError = require("../utils/ExpressError.js");
const mbxGeoCoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocodingClient = mbxGeoCoding({ accessToken: process.env.MAP_TOKEN });

const geocodeListingLocation = async ({ location, country }) => {
    const response = await geocodingClient.forwardGeocode({
        query: `${location}, ${country}`,
        limit: 1,
    }).send();
    const coordinates = response.body.features?.[0]?.geometry?.coordinates;

    if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite)
    ) {
        throw new ExpressError(422, `Could not find coordinates for "${location}, ${country}".`);
    }

    console.log(`Geocoded "${location}, ${country}": longitude ${coordinates[0]}, latitude ${coordinates[1]}`);
    return coordinates;
};


module.exports.index = async (req, res) => {
    const searchLocation = typeof req.query.location === "string"
        ? req.query.location.trim()
        : "";
    const filter = searchLocation
        ? {
            $or: ["location", "country", "title"].map((field) => ({
                [field]: { $regex: searchLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
            })),
        }
        : {};
    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings, searchLocation });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("reviews")
        .populate("owner")
        .populate({ path: "reviews", populate: { path: "author" } });
    if(!listing){
        req.flash("error", "Listing You Requested Doesn't Exist....")
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/h_300,w_250");
    const isOwner = Boolean(
        req.user &&
        listing.owner &&
        String(listing.owner._id) === String(req.user._id)
    );
    const [longitude = null, latitude = null] = listing.geometry?.coordinates || [];
    res.render("listings/show.ejs", { listing, isOwner, longitude, latitude });
};

module.exports.createListing = async (req, res) => {
    if (!req.file) {
        throw new ExpressError(400, "Please choose an image to upload.");
    }

    const { path: url, filename } = req.file;
    const listingData = { ...req.body.listing };
    const coordinates = await geocodeListingLocation(listingData);

    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = { type: "Point", coordinates };
    await newListing.save();
    req.flash("success", "New Listing Created!!");
    res.redirect("/listings");
};


module.exports.renderEditForm = (req, res) => {
    const listing = res.locals.listing;
    const originalImageUrl = listing.image && listing.image.url
        ? listing.image.url.replace("/upload", "/upload/h_300,w_250")
        : null;
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = (async (req, res) => {
    const { id } = req.params;
    const listingData = { ...req.body.listing };
    const coordinates = await geocodeListingLocation(listingData);
    listingData.geometry = { type: "Point", coordinates };
    if (req.file) {
        listingData.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    } else if (listingData.image) {
        listingData.image = { url: listingData.image };
    }
    await Listing.findByIdAndUpdate(id, listingData, { runValidators: true });
    req.flash("success","Listing Updated");
    res.redirect(`/listings/${id}`);
});

module.exports.destroyListing = async (req,res)=>{
  let {id} = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};