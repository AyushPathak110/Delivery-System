const mongoose = require('mongoose');
const review = require('./review');

const packagesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    contact: {
        phone: {
            type: String,
            required: true,
            match: /^[0-9]{10}$/,  // Assuming a 10-digit phone number format
        },
        email: {
            type: String,
            required: false,
            match: /.+\@.+\..+/,
            unique: true
        }
    },
    address: {
        type: String,
        required: true,  // Full address as a single string
    },
    area: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      image:{
        type: String,
        default: 'https://thumbs.dreamstime.com/b/grocery-shop-cartoon-greengrocer-store-facade-front-view-isolated-one-story-building-awning-signboard-place-sale-small-210597654.jpg'
      },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "agent",  // Reference to the shop owner model
        required: true,
    },
    notice: String,
    open: {
        type: Boolean,
        default: true
    },
    items: [{
        name: { type: String, required: true },
        price: { type: String, required: true }
      }],
    review: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews",
    }]
});

packagesSchema.post("findOneAndDelete", async (package) => {
    if (package && package.review.length) {
        await review.deleteMany({ _id: { $in: package.review } });
    }
});

const Package = mongoose.model('Package', packagesSchema);

module.exports = Package;
