const express = require("express");
const User = require("../models/User");
const router = express.Router();

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const cloudinary = require("cloudinary").v2;

router.post("/user/signup", async (req, res) => {
  try {
    const password = req.fields.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

    if (req.fields.username === undefined) {
      res.json({ message: "Username is not defined" });
    }
    const user = await User.findOne({ email: req.fields.email });
    if (user) {
      res.json({ message: "Email already exist !" });
    } else {
      const newUser = new User({
        email: req.fields.email,
        account: {
          username: req.fields.username,
          phone: req.fields.phone,
        },
        token: token,
        hash: hash,
        salt: salt,
      });
      await newUser.save();
      res.json({
        id: newUser._id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
          phone: newUser.account.phone,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });
    if (user) {
      newHash = SHA256(req.fields.password + user.salt).toString(encBase64);
      if (newhash === user.hash) {
        res.json({
          id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
            phone: newUser.account.phone,
          },
        });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/upload", async (req, res) => {
  //console.log(req.files);
  try {
    let pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload);
    return res.json(result);
  } catch (error) {
    return res.json({ error: error.message });
  }
});

module.exports = router;
