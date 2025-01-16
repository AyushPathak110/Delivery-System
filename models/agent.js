const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const agentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  }, 
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/,
  },
  address: {
    type: String,
    required: true,
  },
  IDNumber: {
    type: Number,
    required: true,
    unique: true,
    match: /^[0-9]{12}$/, // Ensures IDNumber is exactly 12 digits
  },
  verified: {
    type: Boolean,
    default: false,
  },
});


agentSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("agent", agentSchema);
