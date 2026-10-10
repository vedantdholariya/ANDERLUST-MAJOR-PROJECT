const mongoose = require("mongoose");
const Review = require("./review.js");

const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        filename: String,
    },

    image: {
       url:String,

    },

    price: {
        type: Number,
    },

    location: {
        type: String,
    },

    country: {
        type: String,
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    reviews:[
        {
        type: Schema.Types.ObjectId,
        ref : "Review",
        },
    ],
    owner :{
        type: Schema.Types.ObjectId,
        ref:"User",
    },
    category:{
        type:String,
        enum:["mountains","arctic","farms","deserts"]
    }
    
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id : {$in: listing.reviews}});

    } 
});
const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;