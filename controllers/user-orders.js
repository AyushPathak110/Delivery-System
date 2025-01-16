const Booking = require("../models/bookinmodel");
const delivery = require("../models/delivery");

async function getYourOrders(req, res) {
  const data = await Booking.find({ "user.email": req.user.email }).populate("rider").populate("sname");
  res.render("../views/viewConfirmed.ejs", { data });
}
 
function loadDeliveryAccForm(req, res) {
  res.render("../views/delivery-login.ejs");
}

function makeAccountForm(req, res){
    res.render('../views/delivery-signup.ejs')
}
  
module.exports = { getYourOrders, loadDeliveryAccForm, makeAccountForm };
