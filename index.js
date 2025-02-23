const express = require("express");
const app = express();
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const userLogin = require("./routes/login");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const passportLocal = require("passport-local");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const packages = require("./models/packages");
const User = require("./models/user");
const agentUser = require("./models/agent");
const agentLogin = require("./routes/alogin");
const newPackage = require("./routes/package");
const routeBook = require("./routes/bookRoute");
const path = require("path");
const Package = require("./models/packages");
const reviewStuff = require("./routes/review");
const newStuff = require("./routes/userNew");
const rider = require("./routes/rider");
const delivery = require("./models/delivery");
const nodemailer = require("nodemailer");
require("dotenv").config();

const wrapAsync = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session({
    secret: "MySecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 1 * 24 * 60 * 60 * 1000,
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use("user-local", new passportLocal(User.authenticate()));
passport.use("agent-local", new passportLocal(agentUser.authenticate()));
passport.use("delivery-local", new passportLocal(delivery.authenticate()));

passport.serializeUser((user, done) => {
  done(null, { id: user._id, type: user.constructor.modelName });
});

passport.deserializeUser(async (obj, done) => {
  try {
    const model = 
      obj.type === "User" ? User : 
      obj.type === "delivery" ? delivery : 
      agentUser;

    const user = await model.findById(obj.id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});


app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in first");
    return res.redirect("/user-login");
  }
  next();
};

app.use("/user-login", userLogin);
app.use("/agent-login", agentLogin);
app.use("/new", newPackage);
app.use("/book", routeBook);
app.use("/review", reviewStuff);
app.use("/user", newStuff);
app.use("/rider", rider);

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Delivery-System");
}

app.get(
  "/",
  wrapAsync(async (req, res) => {
    const group = await packages.find().populate("owner");
    res.render("home", { packages: group });
  })
);

// app.get("/trending",wrapAsync( async (req, res) => {
//   const trendingPlaces = await packages.find({ trending: true });
//   res.render("trending", { packages: trendingPlaces });
// }))

app.get(
  "/show/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const thisOne = await Package.findById(id).populate("owner").populate("review");
    console.log(thisOne);
    res.render("show", { data: thisOne });
  })
);

app.delete(
  "/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const thisOne = await packages.findById(req.params.id);
    if (req.user.id != thisOne.owner) {
      req.flash("error", "You don't have permission to delete it.");
      res.redirect(`/show/${req.params.id}`);
    } else {
      await packages.findByIdAndDelete(req.params.id);
      req.flash("success", "Listing Deleted..");
      return res.redirect("/");
    }
  })
);

app.patch(
  "/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    try {
      let {
        name,
        contact,
        address,
        area,
        city,
        state,
        items,
        open,
        image,
        notice
      } = req.body;

      if (items.endsWith(",")) {
        items = items.slice(0, -1);
      }

      const parsedItems = items.split(",").map((item) => {
        const [itemName, price] = item.trim().split(":");
        return {
          name: itemName.trim(),
          price: price.trim(),
        };
      });

      const newData = {
        name,
        contact: {
          phone: contact.phone,
          email: contact.email,
        },
        address,
        area,
        city,
        state,
        items: parsedItems,
        open,
        notice,
        image: image || undefined, // Use default if no image is provided
      };
      const originalData = await packages.findById(req.params.id);
      if (req.user.id != originalData.owner) {
        req.flash("error", "You are not the owner.");
        res.redirect(`/show/${req.params.id}`);
      } else {
        await packages.findByIdAndUpdate(req.params.id, { $set: newData });
        req.flash("success", "Edited successfully!");
        res.redirect(`/show/${req.params.id}`);
      }
    } catch (e) {
      req.flash("error", e.message);
      res.redirect(`/edit/${req.params.id}`);
    }
  })
);

app.get(
  "/edit/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const id = req.params.id;
    const thisOne = await packages.findById(id);
    // thisOne.items = thisOne.items.map(item => {
    //   return{
    //     ...product,
    //     price:product.price.replace("₹","")
    //   }
    // }
    // )
    res.render("edit", { data: thisOne });
  })
);

app.get(
  "/viewCategory/:season",
  wrapAsync(async (req, res) => {
    const seasonNow = req.params.season;
    const data = await Package.find({ city: seasonNow });
    res.render("trending", { packages: data });
  })
);

app.get(
  "/verify",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const data = await agentUser.find({});
    res.render("verify", { data });
  })
);

app.patch("/verify/:id", isLoggedIn, async (req, res) => {
  try {
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
        subject: "Approval",
        text: `Dear ${thisOne.name},\n\nWe are giving you perks of a Shopkeeper. Contact us if have any query. Thank you.`,
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
        thisOne.verified = true;
        await agentUser.findByIdAndUpdate(id, { $set: thisOne });
        console.log("Email sent:", info.response);
        req.flash("success", "An  email has been sent.");
        res.redirect("/verify");
      });
    } else {
      res.send("You don't have the permission");
    }
  } catch (err) {
    console.error(err);
    req.flash("error", "There was an issue.");
    res.redirect("/verify");
  }
});

app.patch(
  "/noVerify/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    try {
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
          text: `Dear ${thisOne.name},\n\nWe are not giving you perks of a shopkeeper or if you had them before then we are canceling it from now on. Contact us if have any query. Thank you.`,
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
    } catch (err) {
      console.error(err);
      req.flash("error", "There was an issue.");
      res.redirect("/verify");
    }
  })
);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.send("Something went wrong!");
});

app.listen(8080);
