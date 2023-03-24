const express = require("express");
const router = express.Router();
const FlenderUsersSchema = require("../model/flenderTsUserSchema");
require("dotenv").config();

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
	}
});

// HAS TO BE LAST LINE
module.exports = router;
