const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
