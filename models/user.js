const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        match: /.+\@.+\..+/
    },
    fname:{
        type: String,
        required: true
    },
    lname:{
        type: String,
        required: true
    }
})

userSchema.plugin(passportLocalMongoose)
module.exports = mongoose.model("User", userSchema)