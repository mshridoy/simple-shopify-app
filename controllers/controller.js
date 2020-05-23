const fs = require("fs");
const Shop = require("../models/Shop");
const Shopify = require("shopify-api-node");
const path = require("path");

const script = require("../script");

const forwardingAddress = process.env.FORWARDING_ADDRESS;

exports.saveValue = async (req, res) => {
  try {
    const { value, shopName } = req.body;
    if (!value || !shopName) {
      return res.status(400).json({ msg: "please include right req body" });
    }

    const result = await Shop.findOneAndUpdate(
      { shopName },
      { value },
      { new: true }
    );
    res.status(201).json({ result });
  } catch (err) {
    res.status(500).json({ err });
  }
};

exports.getExistingResult = async (req, res) => {
  try {
    const { shopName } = req.body;
    if (!shopName) {
      return res.status(400).json({ msg: "please include right req body" });
    }
    const result = await Shop.findOne({ shopName });
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ err });
  }
};

exports.createScriptTag = async (req, res) => {
  try {
    const { shopName, accessToken } = req.body;
    if (!accessToken || !shopName) {
      return res.status(400).json({ msg: "please include right req body" });
    }
    const shop = await Shop.findOne({ shopName });
    const shopify = new Shopify({
      shopName,
      accessToken,
    });

    const result = await shopify.scriptTag.create({
      event: "onload",
      src: `${forwardingAddress}/script/${shop._id}`,
    });

    shop.scriptTagId = result.id;
    shop.scriptTagState = true;
    await shop.save();
    res.status(201).json({ msg: "successfully script tag created" });
    shopify.scriptTag.list().then((e) => console.log(e));
  } catch (err) {
    res.status(500).json({ err });
  }
};

exports.deleteScriptTag = async (req, res) => {
  try {
    const { shopName, accessToken } = req.body;
    if (!accessToken || !shopName) {
      return res.status(400).json({ msg: "please include right req body" });
    }
    const shop = await Shop.findOne({ shopName });
    const shopify = new Shopify({
      shopName,
      accessToken,
    });

    await shopify.scriptTag.delete(shop.scriptTagId);

    shop.scriptTagId = null;
    shop.scriptTagState = false;

    await shop.save();

    res.status(201).json({ msg: "successfully script tag created" });
  } catch (err) {
    res.status(500).json({ err });
  }
};

exports.scriptHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "// please include right req body" });
    }
    const shop = await Shop.findById(id);
    const data = script(shop);
    res.status(200).send(data);
  } catch (err) {
    res.status(400).send("// server error");
  }
};
