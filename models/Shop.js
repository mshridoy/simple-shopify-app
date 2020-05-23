const mongoose = require("mongoose");

const { Schema } = mongoose;

const shopSchema = new Schema(
  {
    shopName: {
      type: String,
      required: true,
    },
    value: {
      type: String,
    },
    scriptTagState: Boolean,
    scriptTagId: String,
    isUnInstalled: Boolean,
    unInstalledDate: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shop", shopSchema);
