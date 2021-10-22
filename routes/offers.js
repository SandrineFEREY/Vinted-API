const express = require("express");
const Offer = require("../models/Offer");
const User = require("../models/User");
const router = express.Router();

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const cloudinary = require("cloudinary").v2;
const { populate } = require("../models/User");

///const displayMessage = (req, res, next) => {
//   console.log("My message");
//   next();
// };
// app.use(displayMessage);

//////const isAuthenticated = async (req, res, next) => {
//     if (req.headers.authorization) {
//       const user = await User.findOne({
//         token: req.headers.authorization.replace("Bearer ", "")
//       });

//       if (!user) {
//         return res.status(401).json({ error: "Unauthorized" });
//       } else {
//         req.user = user;
//         // On crée une clé "user" dans req. La route dans laquelle le middleware est appelé     pourra avoir accès à req.user
//         return next();
//       }
//     } else {
//       return res.status(401).json({ error: "Unauthorized" });
//     }
//   };

router.post("/offer/publish", async (req, res) => {
  try {
    //Il va falloir récupérer le compte lié à ce token
    //On va utiliser ici la méthode findOne({token: req.headers.authorization}) ==> copier le token d'un user et verifier qu'il est bien utiliser pour les offres
    const userValide = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    }); /// => le mettre dans isAuthenticated et ajouter dans la route "isAuthenticated" (avant async) soit le laisser ici soit ouvrir un dossier middleWare et un fichier "isAuthentticated".
    console.log(userValide);

    if (userValide) {
      if (req.files.picture) {
        const resultOfCloudinary = await cloudinary.uploader.upload(
          req.files.picture.path
        );
        const offer = new Offer({
          product_name: req.fields.title,
          product_description: req.fields.description,
          product_image: resultOfCloudinary,
          product_price: req.fields.number,
          product_details: [
            {
              marque: req.fields.marque,
            },
            {
              taille: req.fields.taille,
            },
            {
              etat: req.fields.etat,
            },
            {
              couleur: req.fields.couleur,
            },
            {
              emplacement: req.fields.emplacement,
            },
          ],
          owner: userValide,
        });
        await offer.save();
        res.json(offer);
      } else {
        res.json({ message: "Not picture ! so not valid" });
      }
    } else {
      res.json({ message: "User is not found !" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query.page);
    let filters = {};

    //Gestion des filtres
    //Cas ou on envoie un titre d'article
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i"); // on peut verifier avec un console.log(filters)
    }

    //Cas ou on envoie un prix
    // if (req.query.price) {
    //   //filters.product_price = Number(req.query.price);            // pour un chiffre donné sur postman
    //   // filters.product_price = { $lte: Number(req.query.price) };     // $lte = au max
    //   filters.product_price = { $gte: Number(req.query.price) }; // $gte = au moins 100
    // }
    // Cas ou on a un article + un prix
    if (req.query.priceMax) {
      filters.product_price = { $lte: Number(req.query.priceMax) };
    }

    if (req.query.priceMin) {
      filters.product_price.$gte = Number(req.query.priceMin);
      // console.log(filters);
    }

    let sort = {};
    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else {
      sort = { product_price: 1 };
    }

    //Gestion de la pagination
    let page = 1;
    if (req.query.page) {
      page = Number(req.query.page);
    }
    //Gestion de la limit
    let limit = 2;
    if (req.query.limit) {
      limit = Number(req.query.limit);
    }
    console.log(filters);
    const offers = await Offer.find(filters)
      .sort(sort)
      .select("product_name product_price")
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Offer.countDocuments(filters);

    res.json({
      offers: offers,
      count: count,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate({
      path: "owner",
      select: "account",
    });
    if (offer) {
      res.json(offer);
    } else {
      res.json({ message: "offer not found" });
    }
  } catch (error) {
    res.status(400);
    json({ message: error.message });
  }
});

module.exports = router;

//✅ 1 Créer une annonce sans photo ni référence (dans post/body/form-data/définir 2 keys : title + description)
// const offer = new Offer({
//   product_name: req.fields.title,
//   product_description: req.fields.description,
// });
// await offer.save();
// res.json(offer);
//✅ 2 Créer une annonce avec une photo et sans référence (dans post/body/form-data/définir une 3eme key : + picture/file)
// const resultOfCloudinary = await cloudinary.uploader.upload(req.files.picture.path);
// const offer = new Offer({
//   product_name: req.fields.title,
//   product_description: req.fields.description,
//   product_image: resultOfCloudinary,
// });
// await offer.save();
// res.json(offer);
//✅ 3 Créer une annonce avec une photo et une référence
// ===> Il va falloir récupérer le compte lié à ce token
// ==> On va utiliser ici la méthode findOne({token: req.headers.authorization})

//const user = await User.findOne({token: req.headers.authorization.replace("Bearer ", ""),}); ==> ici on doit enlever avec la methode "replace" le Bearer du token (car le Bearer n'est pas present dans l'objet du user d'où "Bearer" => le remplacer par une string vide "".
// console.log(user);

//  if (user) {
//  const resultOfCloudinary = await cloudinary.uploader.upload(req.files.picture.path);
//  const offer = new Offer({
//   product_name: req.fields.title,
//   product_description: req.fields.description,
//   product_image: resultOfCloudinary,
//   owner: user,  ====> le owner est dans le modèle User et donc une ref à "user" qui a un token valide
// });
// await offer.save();
//  res.json(offer);
// } else {
//  res.json({message: "User is not found !"})
//  }

//❌ 4 Créer une annonce avec une photo, une référence et l'utilisation du middleware isAuthenticated => créer une const isAuthenticated
