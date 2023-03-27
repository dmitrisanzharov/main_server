const express = require("express");
const router = express.Router();
require("dotenv").config();
const FinlendersProjectsSchema = require("../utils/connectToFinlendersProjects");

router.get("/finlenders-test", async (req, res) => {
	console.log("ROUTE: /finlenders-test");
	res.send("flinlenders is running");
});

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
		res.status(500).send({
			message: "investment failed on FINLENDERS PROJECT SIDE, SEE LOGS",
		});
	}
});

router.get("/single-project", async (req, res) => {
	console.log("===================================");
	console.log("/single-project");

	try {
		// todo check if project is found
		const { projectName } = req.query;
		console.log("projectName: ", projectName);

		// todo project is NOT found in the
		const doesItExist = await FinlendersProjectsSchema.findOne({
			projectName: projectName,
		});
		console.log("doesItExist: ", doesItExist);

		if (!doesItExist) {
			console.log("project_not_found, NO NOTHING");
			return;
		}
		// todo project is FOUND
		if (doesItExist) {
			console.log("project is found");
			res.send(doesItExist);
			return;
		}
	} catch (error) {
		console.log("error during fetch", error);
		res.status(500).send({ error: "some sort of error" });
	}
});

router.post("/invest-flender-ts", async (req, res) => {
	console.log("===================================");
	console.log("/invest-flender-ts");
	try {
		console.log("req.body", req.body);
		const { amount, projectId } = req.body;

		const investFinlendersProject =
			await FinlendersProjectsSchema.findByIdAndUpdate(
				{ _id: projectId },
				{
					$inc: { totalFunded: amount },
				},
				{ new: true }
			);

		console.log("invested succefully on FINLENDERS SIDE");
		res.send(investFinlendersProject);
	} catch (error) {
		console.log(error);
		res.status(500).send({
			error: "error adding investment on FINLENDERS SIDE, see server logs",
		});
	}
});

// should be at the end
module.exports = router;
