const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/bookinmodel.js");
const Package = require("../models/packages.js");
const agent = require("../models/agent.js");
const nodemailer = require("nodemailer");
require("dotenv").config();
const wrapAsync = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in first");
    return res.redirect("/user-login");
  }
  next();
};

router.get(
  "/:id",
  isLoggedIn,
  wrapAsync((req, res) => {
    res.render("book", { id: req.params.id });
  })
);

router.post("/:id", isLoggedIn, async (req, res) => {
  try {
    let thisOne = await Package.findById(req.params.id);
    const bookingData = {
      user: {
        name: req.body.user.name,
        email: req.body.user.email,
        phone: req.body.user.phone,
        address: req.body.user.address,
      },
      order: req.body.order,
      shop: thisOne.owner,
      sname: req.params.id,
    };

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    req.flash("success", "You will get mail once your Booking is confirmed.");
    res.redirect("/");
  } catch (error) {
    console.error(error);
    req.flash(
      "error",
      "There was an error with your booking. Please try again."
    );
    res.redirect("/");
  }
});

router.get("/view/requests", isLoggedIn, async (req, res) => {
  if (req.user.verified == true) {
    const data = await Booking.find({ status: "Pending", shop:req.user.id }).populate("sname");
  
    // console.log(data)
    // const filteredData = data.filter(
    //   (booking) => booking.shop.owner == req.user._id
    // );

    // console.log(filteredData);
    return res.render("viewRequests", { data });
  }
  res.send("Not allowed.");
});

router.patch("/view/requests/confirm/:id", isLoggedIn, async (req, res) => {
  try {
    if (req.user.verified == true) {
      const id = req.params.id;
      let thisOne = await Booking.findById(id).populate("shop");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: thisOne.user.email,
        subject: "Order confirmation",
        text: `Dear ${thisOne.user.name},\n\nThank you for trusting us! Your order of ${thisOne.order} is confirmed.\n\nWait for more updates, `,
      };
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          req.flash(
            "error",
            "There was an issue sending the confirmation email."
          );
          return res.redirect("/book/view/requests");
        }
        thisOne.status = "Confirmed by shop";
        await Booking.findByIdAndUpdate(id, { $set: thisOne });
        console.log("Email sent:", info.response);
        req.flash("success", "A confirmation email has been sent.");
        res.redirect("/book/view/requests");
      });
    } else {
      res.send("You don't have permission");
    }
  } catch (err) {
    console.error(err);
    req.flash("error", "There was an issue processing your booking.");
    res.redirect("/book/view/requests");
  }
});
router.patch("/view/requests/cancel/:id", isLoggedIn, async (req, res) => {
  try {
    if (req.user.verified == true) {
      const id = req.params.id;
      let thisOne = await Booking.findById(id).populate("shop");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: thisOne.user.email,
        subject: "Booking Cancelation",
        text: `Dear ${thisOne.user.name},\n\nThank you for trusting us, but your order of ${thisOne.order} is canceled. You can contact the shop using ${thisOne.shop.contact.phone} and you can also mail them at ${thisOne.shop.contact.email}.\n\nThank you!`,
      };
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          req.flash(
            "error",
            "There was an issue sending the cancelation email."
          );
          return res.redirect("/book/view/requests");
        }
        console.log("Email sent:", info.response);
        thisOne.status = "Canceled";
        await Booking.findByIdAndUpdate(id, { $set: thisOne });
        req.flash("success", "A cancelation email has been sent.");
        res.redirect("/book/view/requests");
      });
    } else {
      res.send("You don't have permission");
    }
  } catch (err) {
    console.error(err);
    req.flash("error", "There was an issue processing your booking.");
    res.redirect("/book/view/requests");
  }
});

router.get(
  "/view/done",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const data = await Booking.find({ status: {$ne: "Pending"},shop:req.user.id }).populate("shop").populate("rider").populate("sname");
    res.render("viewConfirmed", { data});
  })
);

module.exports = router;
