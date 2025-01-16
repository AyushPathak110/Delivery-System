const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    name: { type: String, required: true },
    email: { type: String, required: true, match: /.+\@.+\..+/},
    phone: { type: Number, required: true, match: /^[0-9]{10}$/},
    address: { type:String , required: true}
  },
  order:{
    type:String,
    required: true
  },
  shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "agent",
      required: true,
  },
  sname:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed by shop", "Canceled", "Delivery partner found", "Delivered"],
    default: "Pending",
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "delivery",
    default: null
},
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
