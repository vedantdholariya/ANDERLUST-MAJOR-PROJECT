const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const MongoUrl = "mongodb://127.0.0.1:27017/WanderLust";

async function main() {
  await mongoose.connect(MongoUrl);
  console.log("Connected to DB");
  await initDB();
  await mongoose.disconnect();
}

async function initDB() {
  await Listing.deleteMany({});
  const listings = initdata.data.map((obj) => ({
    ...obj,
    owner: "6ac7532f9121e678a91ff070",
  }));
  await Listing.insertMany(listings);
  console.log("DATA WAS INITIALIZED");
}

main().catch(async (err) => {
  console.error("Failed to initialize listings:", err);
  await mongoose.disconnect();
  process.exitCode = 1;
});
