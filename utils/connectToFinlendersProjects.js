const { mongoose, Schema } = require("mongoose");

const connection = mongoose.createConnection(
	process.env.MONGO_DB_CONNECTION_TO_FINLENDERS_PROJECTS, // this is name of the collection
	{ useNewUrlParser: true }
);

// error and connection
connection.on(`error`, console.error.bind(console, `connection error:`));
connection.once(`open`, function () {
	console.log(`MongoDB connected to: Finlenders Projects`); // name of  the collection
});

const AnyName = connection.model(
	"finlenders-projects", // this is name of the Database
	new Schema({ name: String }, { strict: false, timestamps: true })
);

module.exports = AnyName;
