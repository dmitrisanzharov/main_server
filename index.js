const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const { connectToMongoDB_MainDB } = require("./utils/connectToMainMongoDB");
connectToMongoDB_MainDB();

// ALL MIDDLEWARE AND STARTING CODE

app.use(express.json());
app.use(cors());

// ROUTER ROUTES
app.use("/flender", require("./routes/flender"));
app.use("/finlenders", require("./routes/finlenders"));
app.use("/flender-ts", require("./routes/flender_ts"));

app.get("/home-test", async (req, res) => {
	res.send("server is up and running");
});

app.listen(port, () => console.log(`listening on port: ${port}`));
