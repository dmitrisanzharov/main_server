const mongoose = require("mongoose");

const PostSchemaOne = mongoose.Schema(
	{
		fName: String,
		sName: String,
		email: String,
		areaCode: String,
		tel: Number,
		password: String,
		flenderId: String,
		totalDeposits: Number,
		totalWithdrawals: Number,
		totalInvestments: Number,
		transactions: [
			{
				transactionId: String,
				transactionType: {
					type: String,
					enum: ["lodgement", "withdrawal", "investment"],
				},
				transactionDate: {
					type: Date,
					default: Date.now(),
				},
				amountInEuro: Number,
			},
		],
	},
	{ strict: false, timestamps: true }
); // strict removes need for schema; timeStamp adds time stamps

let AnyName = mongoose.model("flender-users", PostSchemaOne);
module.exports = AnyName;
