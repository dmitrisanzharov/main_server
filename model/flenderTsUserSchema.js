const mongoose = require("mongoose");
const moment = require("moment");

const PostSchemaOne = mongoose.Schema(
	{
		fName: String,
		sName: String,
		email: String,
		countryCode: String,
		tel: Number,
		password: String,
		flenderId: String,
		totalDeposits: { type: Number, default: 0 },
		totalWithdrawals: { type: Number, default: 0 },
		totalInvestments: { type: Number, default: 0 },
		transactions: [
			{
				transactionType: {
					type: String,
					enum: ["lodgement", "withdrawal", "investment"],
				},
				transactionDate: {
					type: Date,
					default: Date.now,
				},
				amountInEuro: Number,
				loanId: String,
				loanDurationInMonths: Number,
				loanInterestRate: Number,
				monthlyRepayment: Number,
				totalInterestOnThisInvestment: Number,
				projectName: String,
				projectGrade: String,
			},
		],
	},
	{ strict: true, timestamps: true }
); // strict removes need for schema; timeStamp adds time stamps

let AnyName = mongoose.model("flender-ts-users", PostSchemaOne);
module.exports = AnyName;
