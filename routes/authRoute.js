const express = require("express");
const nonce = require("nonce")();
const querystring = require("querystring");
const axios = require("axios");
const crypto = require("crypto");
const Shopify = require("shopify-api-node");

const Shop = require("../models/Shop");

const pricingConfig = require("../pricingConfig.json");

const router = express.Router();
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const forwardingAddress = process.env.FORWARDING_ADDRESS;

const scopes = "read_script_tags,write_script_tags";

// routes
router.get("/shopify", (req, res) => {
  const { shop } = req.query;
  if (shop) {
    const state = nonce();
    const redirectUri = `${forwardingAddress}/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;

    res.cookie("state", state);
    res.redirect(installUrl);
  } else {
    return res
      .status(400)
      .send(
        "Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request"
      );
  }
});

router.get("/shopify/callback", async (req, res) => {
  const { state, shop, hmac, code } = req.query;

  const stateCookie = req.cookies.state;
  if (state !== stateCookie) {
    return res.status(403).send("Request origin cannot be verified");
  }
  if (shop && hmac && code) {
    const map = { ...req.query };
    delete map.signature;
    delete map.hmac;
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, "utf-8");
    const generatedHash = Buffer.from(
      crypto.createHmac("sha256", apiSecret).update(message).digest("hex"),
      "utf-8"
    );
    let hashEquals = false;
    // timingSafeEqual will prevent any timing attacks. Arguments must be buffers
    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
      // timingSafeEqual will return an error if the input buffers are not the same length.
    } catch (e) {
      hashEquals = false;
    }

    if (!hashEquals) {
      return res.status(400).send("HMAC validation failed");
    }

    const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };

    try {
      const [{ data }, shopExist] = await Promise.all([
        axios.post(accessTokenRequestUrl, accessTokenPayload),
        Shop.findOne({ shopName: shop }),
      ]);

      const accessToken = data.access_token;

      res.cookie("shopName", Buffer.from(shop).toString("base64"));
      res.cookie("accessToken", Buffer.from(accessToken).toString("base64"));
      res.cookie("apiKey", Buffer.from(apiKey).toString("base64"));

      //   save shop to database if it's not exist
      if (!shopExist) {
        const shopify = new Shopify({
          shopName: shop,
          accessToken,
        });
        const chargeResult = await shopify.recurringApplicationCharge.create({
          ...pricingConfig,
          return_url: `${forwardingAddress}/payment_success?shopName=${shop}&accessToken=${accessToken}`,
        });

        return res.send(
          `<script>top.window.location = "${chargeResult.confirmation_url}"</script>`
        );
      } else if (shopExist.isUnInstalled) {
        const shopify = new Shopify({
          shopName: shop,
          accessToken,
        });
        const trialDays =
          pricingConfig.trial_days -
          Math.round(
            (shopExist.unInstalledDate - shopExist.createdAt) / 86400000
          );
        const chargeResult = await shopify.recurringApplicationCharge.create({
          ...pricingConfig,
          return_url: `${forwardingAddress}/payment_success?shopName=${shop}&accessToken=${accessToken}&isUnInstalled=true`,
          trial_days: trialDays > 0 ? trialDays : 0,
        });

        return res.send(
          `<script>top.window.location = "${chargeResult.confirmation_url}"</script>`
        );
      }

      res.redirect("/");
    } catch (err) {
      res.status(401).send(err.message);
    }
  } else {
    res.status(400).send("Required parameters missing");
  }
});

router.get("/payment_success", async (req, res) => {
  try {
    const { charge_id, shopName, accessToken, isUnInstalled } = req.query;

    const shopify = new Shopify({
      shopName,
      accessToken,
    });

    // checking charge_id is correct or not
    const [shopExist] = await Promise.all([
      Shop.exists({ shopName }),
      shopify.recurringApplicationCharge.get(charge_id),
      shopify.webhook.create({
        address: `${forwardingAddress}/app_uninstalled`,
        topic: "app/uninstalled",
      }),
    ]);

    if (!shopExist) {
      const shopResult = new Shop({
        shopName,
      });
      await shopResult.save();
    } else if (shopExist && isUnInstalled) {
      await Shop.findOneAndUpdate({ shopName }, { isUnInstalled: false });
    }

    return res.redirect("/");
  } catch (err) {
    res.send("Bad Request");
  }
});

router.post("/app_uninstalled", async (req, res) => {
  const { myshopify_domain } = req.body;
  await Shop.findOneAndUpdate(
    { shopName: myshopify_domain },
    { isUnInstalled: true, unInstalledDate: Date.now() }
  );
  res.json({ done: true });
});

module.exports = router;
