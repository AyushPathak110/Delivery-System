const express = require('express');
const delivery = require("../models/delivery");
const Booking = require("../models/bookinmodel");
const nodemailer = require("nodemailer")
const router = express.Router()

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "Please log in first");
      return res.redirect("/user/delivery-login");
    }
    next();
  };

router.get("/your-orders",isLoggedIn,async(req,res)=>{
  const data = await Booking.find({ rider : req.user, status:"Delivery partner found"}).populate("sname")
  res.render("rider/yourOrders", { data })
})

router.get("/orders",isLoggedIn,async(req,res)=>{
  const data = await Booking.find({status:"Confirmed by shop"}).populate("sname")
  res.render("rider/allOrder", { data })
})

router.patch("/order/confirm/:id",isLoggedIn,async(req,res)=>{
  const id = req.params.id
  if (req.user.constructor.modelName == "delivery"){
  const thisOne = await Booking.findById(id)
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth:{
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      })
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: thisOne.user.email,
          subject: "Delivery rider found!",
      text: `Dear ${thisOne.user.name},\n\n Your Order of ${thisOne.order} is accepted by ${req.user.name}.Contact us if have any query. Thank you.`,
      }
      transporter.sendMail(mailOptions,async(error,info)=>{
          if (error) {
                    console.error("Error sending email:", error);
                    req.flash(
                      "error",
                      "There was an issue sending the confirmation email."
                    );
                    return res.redirect("/rider/orders");
                  }
                  thisOne.status = "Delivery partner found";
                  thisOne.rider = req.user.id;
                  await Booking.findByIdAndUpdate(id, { $set: thisOne });
                  req.flash("success", "An  email has been sent.");
                  res.redirect("/rider/orders");
      })
  }else{
      res.send("You don't have permission for this.")
  }
})

router.patch("/order/cancel/:id",isLoggedIn,async(req,res)=>{
  const id = req.params.id
  if (req.user.constructor.modelName == "delivery"){
  const thisOne = await Booking.findById(id)
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth:{
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      })
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: thisOne.user.email,
          subject: "Order cancelation by delivery partner..",
      text: `Dear ${thisOne.user.name},\n\n Your Order of ${thisOne.order} is canceled by ${req.user.name}.Contact us if have any query. Thank you.`,
      }
      transporter.sendMail(mailOptions,async(error,info)=>{
          if (error) {
                    console.error("Error sending email:", error);
                    req.flash(
                      "error",
                      "There was an issue sending the confirmation email."
                    );
                    return res.redirect("/rider/your-orders");
                  }
                  thisOne.status = "Canceled";
                  await Booking.findByIdAndUpdate(id, { $set: thisOne });
                  req.flash("success", "An  email has been sent.");
                  res.redirect("/rider/your-orders");
      })
  }else{
      res.send("You don't have permission for this.")
  }
})

router.patch("/order/delivered/:id",isLoggedIn,async(req,res)=>{
  const id = req.params.id
  if (req.user.constructor.modelName == "delivery"){
  const thisOne = await Booking.findById(id)
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth:{
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      })
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: thisOne.user.email,
          subject: "Delivered!",
      text: `Dear ${thisOne.user.name},\n\n Your Order of ${thisOne.order} is delivered by ${req.user.name}.Contact us if have any query. Thank you.`,
      }
      transporter.sendMail(mailOptions,async(error,info)=>{
          if (error) {
                    console.error("Error sending email:", error);
                    req.flash(
                      "error",
                      "There was an issue sending the confirmation email."
                    );
                    return res.redirect("/rider/your-orders");
                  }
                  thisOne.status = "Delivered";
                  await Booking.findByIdAndUpdate(id, { $set: thisOne });
                  req.flash("success", "An  email has been sent.");
                  res.redirect("/rider/your-orders");
      })
  }else{
      res.send("You don't have permission for this.")
  }
})

router.get("/verify",isLoggedIn,async(req,res)=>{
    const data = await delivery.find({})
    res.render("rider/verify-rider", { data })

})

router.patch("/verify/:id",isLoggedIn,async(req,res)=>{
    const id = req.params.id
    if (req.user.username == "admin"){
    const thisOne = await delivery.findById(id)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: thisOne.email,
            subject: "Approval",
        text: `Dear ${thisOne.name},\n\nWe are giving you perks of a Rider. Contact us if have any query. Thank you.`,
        }
        transporter.sendMail(mailOptions,async(error,info)=>{
            if (error) {
                      console.error("Error sending email:", error);
                      req.flash(
                        "error",
                        "There was an issue sending the confirmation email."
                      );
                      return res.redirect("/rider/verify");
                    }
                    thisOne.verified = true;
                    await delivery.findByIdAndUpdate(id, { $set: thisOne });
                    req.flash("success", "An  email has been sent.");
                    res.redirect("/rider/verify");
        })
    }else{
        res.send("You don't have permission for this.")
    }
})
router.patch("/no-verify/:id",isLoggedIn,async(req,res)=>{
    const id = req.params.id
    if (req.user.username == "admin") {
            const id = req.params.id;
            let thisOne = await agentUser.findById(id);
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            });
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: thisOne.email,
              subject: "Disapproval",
              text: `Dear ${thisOne.name},\n\nWe are not giving you perks of a rider or if you had them before then we are canceling it from now on. Contact us if have any query. Thank you.`,
            };
            transporter.sendMail(mailOptions, async (error, info) => {
              if (error) {
                console.error("Error sending email:", error);
                req.flash(
                  "error",
                  "There was an issue sending the confirmation email."
                );
                return res.redirect("/verify");
              }
              thisOne.verified = false;
              await agentUser.findByIdAndUpdate(id, { $set: thisOne });
              console.log("Email sent:", info.response);
              req.flash("success", "An  email has been sent.");
              res.redirect("/verify");
            });
          } else {
            res.send("You don't have the permission");
          }
})

module.exports = router