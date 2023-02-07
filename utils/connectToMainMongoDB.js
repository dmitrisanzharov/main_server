const mongoose = require("mongoose");

const connectToMongoDB_MainDB = () => {
	let DB_CONNECTION = process.env.MONGO_DB_CONNECTION_TO_MAIN;
	mongoose.set("strictQuery", false);
	mongoose
		.connect(DB_CONNECTION, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		.then(() => console.log("connected to mainDB Mongo"))
		.catch((err) => console.log(err));
};

module.exports = { connectToMongoDB_MainDB };
