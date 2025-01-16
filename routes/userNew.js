const express = require("express")
const passport = require("passport");
const delivery = require("../models/delivery")
const router = express.Router()

const {getYourOrders, loadDeliveryAccForm, makeAccountForm} = require("../controllers/user-orders")

router.route("/orders").get(getYourOrders)
router.route("/delivery-login").get(loadDeliveryAccForm)
router.route("/delivery-signup").get(makeAccountForm)

router.post("/delivery-login",passport.authenticate("delivery-local",{failureRedirect: '/user-login', failureFlash: true}), (req,res)=>{
    res.redirect("/")
})

router.post("/delivery-signup", async (req,res)=>{
    const {username, password, name, email, phone,verificationDocuments} = req.body
    const data = new delivery({
        username, name, email, phone,verificationDocuments
    })
    await delivery.register(data, password)
    req.login(data, (e) => {
        if (e) {
          return next(e);
        }
        req.flash(
          "success",
          "You will recieve an email as soon as our team verifies you authenticity."
        );
        res.redirect("/");
      })
    })
module.exports = router