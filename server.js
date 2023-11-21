const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
const CONNECTION_URL = process.env.MONGODB_URI || "";

app.use(express.static("files/documents"));
app.use(express.static("files/profileImages"));

app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

// import adminRoutes from "./routes/admin.routes.js";
const adminRoutes = require("./routes/admin.routes.js");
app.use("/admin", adminRoutes);

// import fakeRoutes from "./AddFakeData/fake.routes.js";
// app.use("/fake", fakeRoutes);

// import userRouters from "./routes/user.routers.js";
const userRouters = require("./routes/user.routers.js");
app.use("/user", userRouters);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

mongoose
  .connect(CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })
  )
  .catch((err) => console.log(err));
