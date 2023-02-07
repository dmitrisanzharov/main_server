const express = require("express");
const router = express.Router();
require("dotenv").config();
const FinlendersProjectsSchema = require("../utils/connectToFinlendersProjects");

//@route GET /projects
//desc get all projects
router.get("/projects", async (req, res) => {
	console.log("FINLENDERS, ROUTE: /projects");
	try {
		let data = await FinlendersProjectsSchema.find();
		// console.log("data: ", data);
		res.send(data);
	} catch (error) {
		console.log(error);
	}
});

//@route POST /invest
//desc invest into a project
router.post("/invest", async (req, res) => {
	console.log("FINLENDERS, ROUTE: /invest");
	try {
		// req body
		// console.log(req.body);
		const { projectMongoId, amountInCents } = req.body;

		// invest into the project
		let mongoRes = await FinlendersProjectsSchema.findByIdAndUpdate(
			{ _id: projectMongoId },
			{ $inc: { totalFunded: amountInCents / 100 } },
			{ new: true }
		);

		console.log("mongoRes: ", mongoRes);

		res.send("investment success");
	} catch (error) {
		console.log(error);
		res.send("investment failed");
	}
});

// should be at the end
module.exports = router;
