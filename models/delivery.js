const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose")
const Schema = mongoose.Schema;

const deliveryGuySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false 
    },
    verificationDocuments: {
        type: String,
        required: true,
        match: /^[0-9]{12}$/,
    }
});

deliveryGuySchema.plugin(passportLocalMongoose)
const deliveryGuy = mongoose.model('delivery', deliveryGuySchema);

module.exports = deliveryGuy;
