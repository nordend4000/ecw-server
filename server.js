require("dotenv").config()
const mongoose = require("mongoose")
const express = require("express")
const cors = require("cors")
const Order = require("./models/order")
const User = require("./models/user")
const store = require("./routes/store")
const login = require("./routes/login")
const nodemailer = require("nodemailer")
const { v4: uuidv4 } = require("uuid")
const bcrypt = require("bcryptjs")
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
const webhookSecret = process.env.STRIPE_SECRET_END_POINT
const app = express()
const port = process.env.PORT || 4000
//----------------------------------------- INIT DATABASE ---------------------------------------------------
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", function () {
	console.log("Mongo connected!")
})
// ----------------------------------   Middleware   --------------------------------------
// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
	if (req.originalUrl === "/webhook") {
		next()
	} else {
		express.json()(req, res, next)
	}
})
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	}),
)
app.use(store)
app.use(login)

//----------------------------------------- EMAIL INIT ---------------------------------------------------
let transporter = nodemailer.createTransport({
	host: process.env.NODEMAILER_HOST,
	port: process.env.NODEMAILER_PORT,
	secure: false,
	auth: {
		user: process.env.NODEMAILER_USER,
		pass: process.env.NODEMAILER_PASSWORD,
	},
})
//---------------------------------------------   GET Order DATA   --------------------------------------
app.get("/order/:id", async (req, res) => {
	const idToFind = req.params.id
	try {
		Order.find({})
			.where("customerId")
			.equals(idToFind)
			.exec(function (err, order) {
				if (!order) {
					res.send("No order found")
				}
				if (order) {
					res.send(order)
				}
			})
	} catch (err) {
		console.log(err)
	}
})
app.get("/single-order/:id", async (req, res) => {
	const idToFind = req.params.id
	try {
		Order.find({})
			.where("orderId")
			.equals(idToFind)
			.exec(function (err, order) {
				if (!order) {
					res.send("No order found")
				}
				if (order) {
					res.send(order)
				}
			})
	} catch (err) {
		console.log(err)
	}
})
app.get("/order-list", async (req, res) => {
	try {
		Order.find({}).exec(function (err, order) {
			if (!order) {
				res.send("No order found")
			}
			if (order) {
				res.send(order)
			}
		})
	} catch (err) {
		console.log(err)
	}
})
app.delete("/delete-order/:id", async (req, res) => {
	const id = req.params.id
	await Order.findByIdAndRemove(id).exec()
	res.send("deleted")
})
app.put("/edit-order", async (req, res) => {
	const id = req.body.id
	const newProduct = req.body.product
	const newPrice = req.body.price
	const newPaiement = req.body.paiement
	const newDateExpedition = req.body.dateExpedition
	const newStatus = req.body.status
	const newCurrency = req.body.currency
	await Order.findById(id, function (err, response) {
		if (err) {
			res.send(
				"Ooops, something wrong happened, try again to update your order",
			)
		}
		if (response) {
			response.product = newProduct
			response.price = newPrice
			response.paiement = newPaiement
			response.dateExpedition = newDateExpedition
			response.status = newStatus
			response.currency = newCurrency
			response.save()
			res.send("Your order has been successfuly updated")
		}
	})
})
// --------------------------- GLOBAL VARIABLES FROM CHECKOUT TO FULLFILLED (cleared at the end) ---------------------------
let price = 0
let cart = []
let customerId = ""
let customerEmail = ""
let diffPrice = ""
//----------------------------------------- STRIPE CHECKOUT ---------------------------------------------------
app.post("/create-checkout-session", async (req, res) => {
	cart = req.body.cart
	let priceClient = req.body.price
	price = computePrice(cart)
	if (cart.length > 0 && price != priceClient) {
		diffPrice = "diff price"
	}
	customerId = req.body.customerId
	customerEmail = req.body.customerEmail

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				price_data: {
					currency: "eur",
					product_data: {
						name: "Rebecca ANDERSON Photography",
					},
					unit_amount: price,
				},
				quantity: 1,
			},
		],
		payment_method_types: ["card"],
		mode: "payment",
		success_url: `${process.env.CLIENT_URL}?stripe-paiement-success=true`,
		cancel_url: `${process.env.CLIENT_URL}?stripe-paiement-canceled=true`,
	})
	res.send(session)
})
function computePrice(cart) {
	let subtotal = []
	cart.forEach(item => {
		if (item.selectPurchase === "digital") {
			return subtotal.push(item.digital * item.quantity)
		} else {
			return subtotal.push(
				Math.ceil(
					((item[`${item.printType}`] * item[`${item.printSize}`]) / 100) *
						item.quantity,
				),
			)
		}
	})
	let total = 0
	subtotal.forEach(el => {
		total = total + el
	})
	return total * 100
}
//----------------------------------------- STRIPE WEHBOOK ROUTE ---------------------------------------------------
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
	const sig = req.headers["stripe-signature"]
	let event
	try {
		event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
	} catch (err) {
		// On error, log and return the error message
		console.log(`Error message: ${err.message}`)
		return res.status(400).send(`Webhook Error: ${err.message}`)
	}
	// Successfully constructed event ==> Handle the checkout.session.completed event
	if (event.type === "checkout.session.completed") {
		const session = event.data.object
		//console.log("event", event)
		//console.log("event.data.object", event.data.object)
		fulfillOrder(session)
	}
	// Return a response to acknowledge receipt of the event
	res.json({ received: true })
})
//----------------------------------------- STRIPE checkout.session.completed  ---------------------------------------------------
const fulfillOrder = session => {
	const orderId = `${Date.now()}`
	const listOfProductsEmail = []
	const listOfProductsDB = []
	cart.forEach(el =>
		listOfProductsEmail.push(
			`<li> ${el.name} - ${el.printType} ${el.printSize} ${el.printFinish} - ${el.price}€ </li>`,
		),
	)
	cart.forEach(el =>
		listOfProductsDB.push(
			`${el.name} - ${el.printType} ${el.printSize} ${el.printFinish} - ${el.price}€`,
		),
	)
	let printMessage = ""
	let digitMessage = ""
	let listOfLink = []
	const digit = cart.filter(el => el.selectPurchase == "digital")
	const print = cart.filter(el => el.selectPurchase == "print")
	if (digit.length > 0) {
		digit.forEach(el =>
			listOfLink.push(
				// line below OK WHEN ALL DATABASE PRODUCT HAVE attachment saved
				//`<li> DOWNLOAD ${el.name} : <a href="${el.attachment}">${el.name}</a></li>`,
				`<li> DOWNLOAD ${el.name} : <a href="https://res.cloudinary.com/fdvehksjelpsjklpm/image/upload/fl_attachment/v1632236604/attachment/Big_foot_copie_cz9hzx.jpg">${el.name}</a></li>`,
			),
		)
		digitMessage = `${listOfLink.toString().replace(/,/g, " <br> ")}`
	}
	if (print.length > 0) {
		printMessage =
			"We will start your printing as soon as possible and send you an email with upcoming expedition date."
	}
	let mailOptions = {
		from: process.env.NODEMAILER_USER,
		to: customerEmail,
		subject: `Order Confirmation : Rebecca ANDERSON Photography`,
		html: `
				<div>
					<h1>Rebecca ANDERSON Photography</h1>
					<h4>Order Confirmation N°${orderId}</h4>
					<div>Thanks for your purchase. Your paiement of ${
						price / 100
					} € has been approved.</div><br>
					<h4>YOUR ORDER : </h4>
					<ol>${listOfProductsEmail.toString().replace(/,/g, " <br> ")}</ol><br>
					<div>${digitMessage}</div>
					<br><p>${printMessage}</p><br>
					<p>Have a great day</p>
					<p>Rebecca ANDERSON De La Llana</p>
				</div>
			`,
	}
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error)
		} else {
			console.log("Email sent: " + info.response)
		}
	})
	let status = "pending"
	if (diffPrice === "diff price") status = "validating"
	if (
		print.length === 0 &&
		diffPrice === "" &&
		session.payment_status === "paid"
	) {
		status = "link sent"
	}
	if (diffPrice === "" && session.payment_status === "paid") status = "printing"
	const orderData = {
		orderId: orderId,
		product: `[${listOfProductsDB.toString()}]`,
		price: price / 100,
		paiement: session.payment_status,
		dateOrder: new Date(Date.now()),
		dateExpedition: "",
		status: status,
		customerId: customerId,
		customerEmail: customerEmail,
		stripeCustomer: session.customer,
		stripeEmail: session.customer_details.email,
		stripeAmount: session.amount_total / 100,
		currency: session.currency,
	}
	SaveNewOrder(orderData)
	CheckCustomerToAddOrderId(customerId, orderId)
	clearGlobalVariable()
}
async function SaveNewOrder(orderData) {
	const newOrder = new Order({
		orderId: orderData.orderId,
		product: orderData.product,
		price: orderData.price,
		paiement: orderData.paiement,
		dateOrder: orderData.dateOrder,
		dateExpedition: orderData.dateExpedition,
		status: orderData.status,
		customerId: orderData.customerId,
		customerEmail: orderData.customerEmail,
		stripeCustomer: orderData.stripeCustomer,
		stripeEmail: orderData.stripeEmail,
		stripeAmount: orderData.stripeAmount,
		currency: orderData.currency,
	})
	await newOrder.save()
}
async function CheckCustomerToAddOrderId(customerId, orderId) {
	try {
		await User.findById(customerId, function (err, response) {
			if (response.order === "[]") {
				response.order = `[${orderId}]`
			} else {
				let orderList = response.order.slice(1, -1).split(",")
				orderList.push(orderId)
				response.order = `[${orderList.toString()}]`
			}
			response.save()
		})
	} catch (err) {
		console.log(err)
	}
}
function clearGlobalVariable() {
	price = 0
	cart = []
	customerId = ""
	customerEmail = ""
}
//---------------------------------------------    RESET PASSWORD --------------------------------------
app.put("/reset-password", (req, res) => {
	const email = req.body.email
	const newPassword = uuidv4()
	User.findOne({ email: email }, async function (err, doc) {
		if (err) throw err
		if (!doc)
			res.send(
				"This Email doesn't exist in our database. Please try another one.",
			)
		if (doc) {
			const hashedPassword = await bcrypt.hash(newPassword, 10)
			doc.password = hashedPassword
			doc.save()
			let mailOptions = {
				from: process.env.NODEMAILER_USER,
				to: email,
				subject: `RESET YOUR PASSWORD : Rebecca ANDERSON Photography`,
				html: `
				<div>
					<h1>Rebecca ANDERSON Photography</h1>
					<h4>Reset Your Password</h4>
					<div>You just requested a new password to connect to your account.</div><br>
					<p>Your new password is :  ${newPassword}</p>
					<a href="${process.env.CLIENT_URL}/login">Click here to connect to your account</a>
					<p>You can change your password at anytime in My Account</p>
					<br>
					<p>Have a great day</p>
					<p>Rebecca ANDERSON De La Llana</p>
				</div>
			`,
			}
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error)
					res.send("new password saved but email not sent")
				} else {
					console.log("Email sent: " + info.response)
					res.send("new password saved and email sent")
				}
			})
		}
	})
})
//---------------------------------------------    CONTACT FORM    --------------------------------------
app.post("/contact-form", (req, res) => {
	const email = req.body.email
	const name = req.body.name
	const message = req.body.message
	const customerId = req.body.customerId
	let mailOptions = {
		from: email,
		to: process.env.NODEMAILER_USER,
		subject: `CONTACT FORM SUBMITTED : Rebecca ANDERSON Photography`,
		html: `
				<div>
					<h1>Message from ${name}</h1>
					<h4>Email : ${email}</h4>
					<div>Message :</div>
					<div>${message}</div>
					<br>
					<p>customer id : ${customerId}</p>
				</div>
			`,
	}
	let mailOptions2 = {
		from: process.env.NODEMAILER_USER,
		to: email,
		subject: `CONTACT FORM SUBMITTED : Rebecca ANDERSON Photography`,
		html: `
				<div>
					<h1>Rebecca ANDERSON Photography</h1>
					<h4>Hello ${name}</h4>
					<div>Your message has been sent successfuly. <div>
					<br>
					<div>Your Message :</div>
					<div>${message}</div>
					<p>from email: ${email}</p>
					<br>
					<p>Thanks for your interest, I will answer you as soon as possible...</p>
					<p>Rebecca ANDERSON Photography</p>
				</div>
			`,
	}
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error)
			res.send(
				"Ooops something wrong happened, please try again to send your message.",
			)
		} else {
			transporter.sendMail(mailOptions2, function (error, info) {
				if (error) {
					console.log(error)
					res.send(
						"Ooops something wrong happened, please try again to send your message.",
					)
				} else {
					res.send(
						"Your message has been sent successfuly. Thanks for your interest, I will answer you as soon as possible...",
					)
				}
			})
		}
	})
})
//----------------------------------------- Start Server ---------------------------------------------------
app.listen(port, () => {
	console.log(`Server running on port ${port}!`)
})
