require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(formidable());
mongoose.connect(process.env.MONGODB_URI);
app.use(cors());

cloudinary.config({
  cloud_name: "dnsktyxha",
  api_key: "337291149441842",
  api_secret: "fnF3BJs3S4L7y6V6qztQFfuikZc",
});

const userRoutes = require("./routes/users");
app.use(userRoutes);
const offerRoutes = require("./routes/offers");
app.use(offerRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
