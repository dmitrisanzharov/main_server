const express = require("express");
const router = express.Router();
const FlenderUsersSchema = require("../model/flenderUsersSchema");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/generateJwtToken");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const stripe = require("stripe")("sk_test_4a6S3wzDM6Zo7ttQIULxrad1");
const axios = require("axios");
const uniqid = require("uniqid");
const moment = require("moment");

// VARIABLES

const { connectToMongoDB_MainDB } = require("../utils/connectToMainMongoDB");
connectToMongoDB_MainDB();

let transporter = nodemailer.createTransport({
	host: "mail.ee",
	auth: {
		user: "my_main_server@mail.ee", // usual email
		pass: "3Jdf7DA?zC", // this has to be APP PASSWORD
	},
});

// FUNCTIONS

// ROUTES

// UNPROTECTED

//check if there is a duplicate (use email), and adds a new user
router.post("/add-user", async (req, res) => {
	console.log(req.body);

	const { fName, sName, email, tel, telArea, password } = req.body;

	// check if user exists
	let checkIfExists = await FlenderUsersSchema.findOne({ email: email });
	console.log("checkIfExists: ", checkIfExists);

	if (checkIfExists) {
		res.send("user already exists");
		return;
	}

	// hash the password
	let salt = bcrypt.genSaltSync(10);
	let hash = bcrypt.hashSync(password, salt);
	console.log("hash: ", hash);

	// add the user with password hash
	await FlenderUsersSchema.create({
		fName: fName,
		sName: sName,
		email: email,
		areaCode: telArea,
		tel: tel,
		password: hash,
		flenderId: "flender-" + new Date().getTime().toString(),
		totalDeposits: 0,
		totalWithdrawals: 0,
		totalInvestments: 0,
		transactions: [],
	});

	console.log("user added");

	// find and return user with token but without password
	let finalUser = await FlenderUsersSchema.findOne({ email: email }).select(
		"-password"
	);
	res.send(finalUser._doc);

	console.log("token sent");
});

//@route GET /login-get-user
//desc find the user, returns not found or incorrect password, if all well send TOKEN
router.get("/login-get-user", async (req, res) => {
	const { email, password } = req.query;

	console.log("payload", email, password);

	// check to see if user email is found
	let findUser = await FlenderUsersSchema.findOne({ email: email });
	console.log(findUser);

	if (!findUser) {
		res.send("not found");
		return;
	}

	// check if password is correct

	let passTest = bcrypt.compareSync(password, findUser.password);
	console.log("passTest: ", passTest);

	if (!passTest) {
		res.send("wrong password");
		return;
	}

	// generate token and return the user, but get rid of password
	console.log("email and pass valid, return user");

	const finalUser = findUser._doc;
	delete finalUser.password;

	res.send({ ...finalUser, token: generateToken({ mongoId: finalUser._id }) });
});

//@route POST /reset-password
//desc send mail to reset password
router.post("/reset-password", async (req, res) => {
	// check if email exists
	const { email } = req.body;
	console.log(email);

	let findUser = await FlenderUsersSchema.findOne({ email: email });
	console.log(findUser);

	if (!findUser) {
		res.send("user not found");
		return;
	}

	// GENERATE A TOKEN

	let tokenBasedOnMongoId = generateToken({ mongoId: findUser._id });
	console.log("tokenBasedOnEmail: ", tokenBasedOnMongoId);

	const linkToWebsiteWithToken = `${process.env.CLIENT_SITE}password-reset/${tokenBasedOnMongoId}`;
	console.log("linkToWebsiteWithToken: ", linkToWebsiteWithToken);

	// handle user found
	// send mail with defined transport object
	try {
		let info = await transporter.sendMail({
			from: "my_main_server@mail.ee", // sender address
			to: email, // list of receivers
			subject: "Flender password reset", // Subject line
			html: `<a href='${linkToWebsiteWithToken}'>Message and link with user token</a>`, // plain text body
		});

		console.log("Message sent: %s", info.messageId);
		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
	} catch (error) {
		console.log("error at sendMail stage", error);
	}

	res.send("email sent");
});

//********************************************************************
//         PROTECTED ROUTES
// *******************************************************************

//@route GET /check-token
//desc checks the token and returns the user without password and token
router.get("/check-token", async (req, res) => {
	console.log("ROUTE: /check-token");

	let getTheToken = req.headers.authorization.split(" ")[1];
	// console.log("getTheToken: ", getTheToken);

	let decodedFinal;

	try {
		const decoded = jwt.verify(getTheToken, process.env.JSW_SECRET);
		// console.log("decoded: ", decoded);
		decodedFinal = decoded;
	} catch (error) {
		// console.log("token error", error);
		res.send("token invalid, try again");
		return;
	}

	let finalUser = await FlenderUsersSchema.findOne({
		_id: decodedFinal.mongoId,
	}).select("-password");

	if (!finalUser._id) {
		// console.log("invalid token");
		res.send("token invalid, try again");
		return;
	}

	res.send("token is valid");
});

//@route POST /reset-password-final
//desc checks the token, resets the password, and returns the user with new password
router.post("/reset-password-final", async (req, res) => {
	const { token, password } = req.body;
	console.log("token: ", token);
	console.log("password: ", password);

	// check token
	const { mongoId } = jwt.verify(token, process.env.JSW_SECRET);
	console.log("decoded: ", mongoId);

	// create new password hash
	let salt = bcrypt.genSaltSync(10);
	let hash = bcrypt.hashSync(password, salt);
	console.log("hash: ", hash);

	// update the password
	let finalUser = await FlenderUsersSchema.findOneAndUpdate(
		{ _id: mongoId },
		{ password: hash }
	).select("-password");
	console.log("finalUser: ", finalUser);

	// send email that password has been updated
	try {
		let info = await transporter.sendMail({
			from: "my_main_server@mail.ee", // sender address
			to: finalUser.email, // list of receivers
			subject: "Flender password has been updated", // Subject line
			html: `<a href='${process.env.CLIENT_SITE}login'>Your password has been updated, you can now login safely</a>`, // plain text body
		});

		console.log("Message sent: %s", info.messageId);
		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
	} catch (error) {
		console.log("error at sendMail stage", error);
	}

	// create a new token
	let tokenBasedOnMongoId = generateToken({ mongoId: finalUser._id });

	let finalUser2 = { ...finalUser._doc, token: tokenBasedOnMongoId };
	console.log("finalUser2: ", finalUser2);

	// return the user
	res.send(finalUser2);
});

//@route POST /lodgement
//desc lodge money

router.post("/lodgement", async (req, res) => {
	// check body
	console.log("req.body", req.body);
	const { mongoId, amount, token } = req.body;

	//add to user balance
	let mongoRes = await FlenderUsersSchema.findByIdAndUpdate(
		{ _id: mongoId },
		{ $inc: { totalDeposits: amount } },
		{ new: true }
	).select("-password");

	console.log("mongoRes: ", mongoRes);

	// handle error
	if (!mongoRes._id) {
		res.send("error when adding money");
		return;
	}

	// added successfully
	console.log("money added successfully");
	res.send({ ...mongoRes._doc, token: token });

	// return new user
});

//@route POST /stripe-payment-intent
//desc make a payment to stripe
router.post("/stripe-payment-intent", async (req, res) => {
	try {
		const { amount, flenderId, mongoId, email, time } = req.body;

		console.log(req.body);

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100,
			currency: "eur",
			automatic_payment_methods: { enabled: true },
			description: JSON.stringify({
				flenderId,
				mongoId,
				email,
				time,
			}), // I can use .split method with | and :  to extract data from the string
		});

		console.log("paymentIntent --- SUCCESS", paymentIntent.id);

		// handleErrors
		if (!paymentIntent) {
			res.send("error with payment, server side");
			return;
		}

		res.send(paymentIntent.client_secret);
	} catch (error) {
		console.log(error);
	}
});

//@route PATCH /confirm-lodgement
//desc confirm- lodgement, update mongodb and return new user
router.patch("/confirm-lodgement", async (req, res) => {
	try {
		console.log(req.body);

		const { paymentId, mongoId, amountInCents } = req.body;

		// find the user
		let user = await FlenderUsersSchema.findOneAndUpdate(
			{ _id: mongoId },
			{
				$inc: { totalDeposits: amountInCents / 100 },
				$push: {
					transactions: {
						paymentId: paymentId,
						amountInEuro: amountInCents / 100,
						transactionType: "lodgement",
					},
				},
			},

			{ new: true }
		).select("-password");
		console.log("user: ", user);
		res.send(user);
	} catch (error) {
		console.log(error);
	}
});

//@route PATCH /withdrawal
//desc withdraw amount and reset the user
router.patch("/withdrawal", async (req, res) => {
	try {
		// check body
		console.log(req.body);
		const { amountInCents, mongoId } = req.body;

		// update the user
		const user = await FlenderUsersSchema.findOneAndUpdate(
			{ _id: mongoId },
			{
				$inc: { totalDeposits: amountInCents / -100 },
				$push: {
					transactions: {
						paymentId: `pi_${uniqid()}`,
						amountInEuro: amountInCents / -100,
						transactionType: "withdrawal",
					},
				},
			},
			{ new: true }
		).select("-password");
		console.log("user: ", user);
		res.send(user);
	} catch (error) {
		console.log(error);
	}
});

//@route PATCH /investment
//desc invest money into project
router.patch("/investment", async (req, res) => {
	console.log("ROUTE: /investment");

	try {
		// req.body
		// console.log(req.body);
		const { userMongoId, amountInvestedInCents, projectName } = req.body;

		let mongoRes = await FlenderUsersSchema.findByIdAndUpdate(
			{ _id: userMongoId },
			{
				$inc: { totalInvestments: amountInvestedInCents / 100 },
				$push: {
					transactions: {
						transactionId: new Date().getTime().toString() + "-" + projectName,
						transactionType: "investment",
						amountInEuro: amountInvestedInCents / 100,
					},
				},
			},
			{ new: true }
		).select("-password");
		// console.log(mongoRes);
		res.send(mongoRes);
	} catch (error) {
		console.log(error);
	}
});

// HAS TO BE LAST LINE
module.exports = router;
