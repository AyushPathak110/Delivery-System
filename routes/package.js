const express = require("express");
const router = express.Router();
const packages = require("../models/packages");
const wrapAsync = (fn)=>{
  return function(req, res, next){
    fn(req,res,next).catch(next)
  }
}
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in first");
    return res.redirect("/user-login");
  }
  next();
};

router.get("/", isLoggedIn,wrapAsync( (req, res) => {
  if (req.user.verified) {
    res.render("new");
  } else {
    req.flash("error", "You don't have the permission")
    res.redirect("/");
  }
}))

router.post('/',isLoggedIn,wrapAsync( async (req, res) => {
  try {
    if(req.user.verified){
      const { name, contact, address, area, city, state, items, image } = req.body;

      const parsedItems = items.split(',').map(item => {
          const [itemName, price] = item.trim().split(':');
          return { 
              name: itemName.trim(), 
              price: price.trim()
          };
      });

      const newPackage = new packages({
          name,
          contact: {
              phone: contact.phone,
              email: contact.email
          },
          address,
          area,
          city,
          state,
          items: parsedItems,
          image: image || undefined, // Use default if no image is provided       
          owner: req.user._id, // Assuming user is authenticated and their ID is available
      });

      await newPackage.save();
      req.flash("success", "Done!")
      res.redirect("/");
  }else{
    return res.send("something went wrong")
  }} catch (error) {
      console.error("Error saving package:", error);
      res.status(500).send("An error occurred while saving the package.");
  }
}));

module.exports = router;
