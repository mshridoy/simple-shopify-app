const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// import routers/ controller
const authRoute = require("./routes/authRoute");
const controller = require("./controllers/controller");

// middle wares
app.use(express.static(path.join(__dirname, "client", "build")));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(authRoute);
app.post("/save_value", controller.saveValue);
app.post("/get_existing_result", controller.getExistingResult);
app.post("/create_script_tag", controller.createScriptTag);
app.post("/delete_script_tag", controller.deleteScriptTag);
app.get("/script/:id", controller.scriptHandler);

// serve front end
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
