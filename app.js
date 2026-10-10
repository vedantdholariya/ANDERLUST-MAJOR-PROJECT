if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// console.log(process.env.SECRET);


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMATE = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");


// const MongoUrl = "mongodb://127.0.0.1:27017/WanderLust";
const dbUrl = process.env.ATLASDB_URL;


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");

const session = require("express-session");
const { MongoStore } = require("connect-mongo");


const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");



async function startServer() {
    if (!dbUrl) {
        throw new Error("ATLASDB_URL is not set. Add your MongoDB Atlas connection string to .env.");
    }

    await mongoose.connect(dbUrl);
    console.log("Connected to DB");

    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride((req) => {
    if (req.body && typeof req.body === "object" && req.body._method) {
        return req.body._method;
    }
    return req.query && req.query._method;
}));
app.engine('ejs', ejsMATE);
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto:{
        secret:"process.env.SECRET",
    },
    touchAfter : 24 * 3600,
});

store.on("error",(err)=>{
    console.log("ERROR IN MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,
    secret : "process.env.SECRET",
    resave : false,
    saveUninitialized : true,

    cookie:{
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    },
};


// / app.get("/", (req, res) => {
// //     res.send("Hi, I Am Root");
// // });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});



app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!!!"));
});

app.use((err,req,res,next)=>{
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
    // res.status(statusCode).send(message);
})

const port = process.env.PORT || 8080;

startServer().catch((err) => {
    console.error("Failed to connect to MongoDB Atlas:", err.message);
    process.exit(1);
});
