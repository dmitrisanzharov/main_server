const express = require("express");
const router = express.Router();
const FlenderUsersSchema = require("../model/flenderTsUserSchema");
const nodemailer = require("nodemailer");
const moment = require("moment");
require("dotenv").config();

// variables

// ROUTES
router.post("/add-user", async (req, res) => {
	console.log("===================================");
	console.log("/add-user");

	try {
		// destructure
		console.log("req.body", req.body);
		const { fName, sName, email, countryCode, telephone, password } = req.body;

		// check if user exists
		const checkIfExists = await FlenderUsersSchema.findOne({ email: email });
		console.log("checkIfExists: ", checkIfExists);

		// if user DOES NOT exists
		if (!checkIfExists) {
			await FlenderUsersSchema.create({
				fName: fName,
				sName: sName,
				email: email,
				countryCode: countryCode,
				tel: telephone,
				password: password,
				flenderId: "flender-" + new Date().getTime().toString(),
			});
			console.log("user added");
			res.send("user_added_successfully");
			return;
		}

		//if user DOES EXIST - send res that user exists and they need to login instead
		if (checkIfExists !== null) {
			console.log("user already exists");
			res.send("user_already_exists");
			return;
		}
	} catch (err) {
		console.log(err);
	}
});

router.get("/login", async (req, res) => {
	console.log("===================================");
	console.log("/login");

	try {
		console.log("req.query", req.query);
		const { email, password } = req.query;

		// get user by email - find out if user exists
		const checkIfExists = await FlenderUsersSchema.findOne({ email: email });
		console.log("checkIfExists: ", checkIfExists);

		// if user does NOT exists
		if (checkIfExists === null) {
			console.log("no user found");
			res.send("no_user_found");
			return;
		}

		// if user exists but password is incorrect
		if (checkIfExists && checkIfExists.password !== password) {
			console.log("password_is_incorrect");
			res.send("password_is_incorrect");
			return;
		}

		// todo if all is good, so send instruction to redirect and save user as a Session
		if (checkIfExists && checkIfExists.password === password) {
			console.log("user_found_success");
			res.send(checkIfExists);
			return;
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: "error, see server logs" });
	}
});

router.get("/password-reset-email-page", async (req, res) => {
	console.log("===================================");
	console.log("/password-reset-email-page");
	try {
		const { email } = req.query;
		console.log("email: ", email);

		const linkToResetPasswordDev =
			"http://localhost:3000/password-reset-page" + `?email=${email}`;

		const linkToResetPasswordPROD =
			"http://localhost:3000/password-reset-page" + `?email=${email}`;

		const doesItExist = await FlenderUsersSchema.findOne({ email: email });
		console.log("doesItExist: ", doesItExist);

		if (!doesItExist) {
			console.log("email_does_not_exist");
			res.send("email_does_not_exist");
			return;
		}

		if (doesItExist) {
			console.log("email is found, send reset link");
			res.send("email_is_found");

			let transporter = nodemailer.createTransport({
				host: "mail.ee",
				auth: {
					user: "my_main_server@mail.ee", // usual email
					pass: "Z3SZr6Eib8", // this has to be APP PASSWORD
				},
			});

			let info = await transporter.sendMail({
				from: "my_main_server@mail.ee", // sender address
				to: "moneytreee2016@gmail.com", // list of receivers
				subject: "Password reset link", // Subject line
				html: `<h1>Here is your link</h1>
				<a href=${linkToResetPasswordDev} target="_blank">link to reset password</a>`,
			});

			console.log("Message sent: %s", info.messageId);

			return;
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: "error, see server logs" });
	}
});

router.get("/password-reset-page", async (req, res) => {
	console.log("===================================");
	console.log("/password-reset-page");
	try {
		const { password, email } = req.query;
		console.log("req.query", req.query);

		let updateOne = await FlenderUsersSchema.findOneAndUpdate(
			{ email: email },
			{ password: password },
			{ new: true }
		);
		console.log("updateOne: ", updateOne);
		res.send("password_updated");
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: "error, see server logs" });
	}
});

router.get("/add-funds", async (req, res) => {
	console.log("===================================");
	console.log("/add-funds");
	try {
		console.log(req.query);
		const { userId, amountInEuro } = req.query;

		let addToUserTransaction = await FlenderUsersSchema.findByIdAndUpdate(
			{ _id: userId },
			{
				$inc: { totalDeposits: amountInEuro },
				$push: {
					transactions: {
						transactionType: "lodgement",
						amountInEuro: amountInEuro,
					},
				},
			},
			{ new: true }
		);
		console.log("addToUserTransaction: ", addToUserTransaction);
		console.log("money added successfully");

		res.send(addToUserTransaction);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: "error, see server logs" });
	}
});

router.get("/withdraw", async (req, res) => {
	console.log("===================================");
	console.log("/withdraw");
	try {
		console.log(req.query);
		const { amount, userId } = req.query;

		let addToUserTransaction = await FlenderUsersSchema.findByIdAndUpdate(
			{ _id: userId },
			{
				$inc: { totalWithdrawals: amount },
				$push: {
					transactions: {
						transactionType: "withdrawal",
						amountInEuro: amount,
					},
				},
			},
			{ new: true }
		);
		console.log("addToUserTransaction: ", addToUserTransaction);
		console.log("withdrawn successfully");

		res.send(addToUserTransaction);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: "error, see server logs" });
	}
});

router.post("/invest", async (req, res) => {
	console.log("===================================");
	console.log("/invest");
	try {
		console.log("req.body", req.body);
		const {
			userId,
			amount,
			projectId,
			loanDurationInMonths,
			loanInterestRate,
			monthlyRepayment,
			totalInterestOnThisInvestment,
			projectName,
			projectGrade,
		} = req.body;

		const addToInvest = await FlenderUsersSchema.findByIdAndUpdate(
			{ _id: userId },
			{
				$inc: { totalInvestments: amount },
				$push: {
					transactions: {
						transactionType: "investment",
						amountInEuro: amount,
						loanId: projectId,
						loanDurationInMonths: loanDurationInMonths,
						loanInterestRate: loanInterestRate,
						monthlyRepayment: monthlyRepayment,
						totalInterestOnThisInvestment: totalInterestOnThisInvestment,
						projectName: projectName,
						projectGrade: projectGrade,
					},
				},
			},
			{ new: true }
		);
		console.log("addToInvest: ", addToInvest);
		console.log("invested successfully");

		res.send(addToInvest);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).send({
			error:
				"error adding money to TOTAL INVESTMENTS for USER side, see server logs",
		});
	}
});

// HAS TO BE LAST LINE
module.exports = router;
