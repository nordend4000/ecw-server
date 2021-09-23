const User = require("../models/user")
const express = require("express")
const routerLogin = express.Router()
const bcrypt = require("bcryptjs")

routerLogin.use(function middleware(req, res, next) {
	next()
})
//---------------------------------------------   GET USER DATA   --------------------------------------
routerLogin.get("/user/:idToGet", async (req, res) => {
	const idToGet = req.params.idToGet
	try {
		await User.findById(idToGet, (err, user) => {
			if (!user) {
				res.send("bug cookie")
			}
			if (user) {
				res.send(user)
			}
		})
	} catch (err) {
		console.log(err)
	}
})
routerLogin.get("/user-by-email/:email", async (req, res) => {
	const email = req.params.email
	try {
		await User.findOne({ email: email }, (err, user) => {
			if (!user) {
				res.send("No user found")
			}
			if (user) {
				res.send(user)
			}
		})
	} catch (err) {
		console.log(err)
	}
})
//---------------------------------------------    LOGIN  --------------------------------------
routerLogin.post("/login", (req, res) => {
	User.findOne({ email: req.body.email }, function (err, user) {
		if (err) {
			return send(err)
		}
		if (!user) {
			res.send("Incorrect email address, Try again ...")
		}
		if (user) {
			bcrypt.compare(req.body.password, user.password, (err, result) => {
				if (err) throw err
				if (result === true) {
					res.send(user._id)
				} else {
					res.send("Incorrect password, Try again ...")
				}
			})
		}
	})
})
//---------------------------------------------    REGISTER --------------------------------------
routerLogin.post("/register", (req, res) => {
	User.findOne({ email: req.body.email }, async (err, doc) => {
		if (err) throw err
		if (doc)
			res.send(
				"This Email Already Exists. Login to your account or use another email address to sign in.",
			)
		if (!doc) {
			const pass = req.body.password.toString()
			const hashedPassword = await bcrypt.hash(pass, 10)
			const newUser = new User({
				email: req.body.email,
				password: hashedPassword,
				firstName: "",
				lastName: "",
				streetNumber: "",
				street: "",
				city: "",
				country: "",
				zipCode: "",
				phone: "",
				order: "[]",
			})
			await newUser.save()
			res.send(
				"Your account has been created successfully : Please login to your account",
			)
		}
	})
})
//---------------------------------------------    UPDATE USER DATA --------------------------------------
routerLogin.put("/edit-user", async (req, res) => {
	const id = req.body.id
	const newFirstName = req.body.firstName
	const newLastName = req.body.lastName
	const newStreetNumber = req.body.streetNumber
	const newStreet = req.body.street
	const newCity = req.body.city
	const newZipCode = req.body.zipCode
	const newCountry = req.body.country
	const newPhone = req.body.phone
	await User.findById(id, function (err, response) {
		response.firstName = newFirstName
		response.lastName = newLastName
		response.streetNumber = newStreetNumber
		response.street = newStreet
		response.city = newCity
		response.zipCode = newZipCode
		response.country = newCountry
		response.phone = newPhone
		response.save()
		res.send("update profile ok")
	})
})
//---------------------------------------------    UPDATE PAssword --------------------------------------
routerLogin.put("/update-password", async (req, res) => {
	const id = req.body.id
	const oldPassword = req.body.oldPassword.toString()
	const newPassword = req.body.newPassword.toString()
	await User.findById(id, async function (err, doc) {
		if (err) throw err
		if (!doc) {
			res.send(
				"Ooops something wrong happenned, this user doesn't exist in our database. Please try again.",
			)
		}
		if (doc) {
			await bcrypt.compare(oldPassword, doc.password, async (err, result) => {
				if (err) throw err
				if (result === false) {
					res.send(
						"The previous password you just entered doesn't match in our database. Please try again.",
					)
				}
				if (result === true) {
					const hashedPassword = await bcrypt.hash(newPassword, 10)
					doc.password = hashedPassword
					doc.save()
					res.send("Your new password has been saved successfully.")
				}
			})
		}
	})
})

module.exports = routerLogin
