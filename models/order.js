const mongoose = require("mongoose")

const order = new mongoose.Schema({
	orderId: {
		type: String,
		required: true,
	},
	product: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	paiement: {
		type: String,
		required: false,
	},
	dateOrder: {
		type: String,
		required: false,
	},
	dateExpedition: {
		type: String,
		required: false,
	},
	status: {
		type: String,
		required: false,
	},
	customerId: {
		type: String,
		required: false,
	},
	customerEmail: {
		type: String,
		required: false,
	},
	stripeEmail: {
		type: String,
		required: false,
	},
	stripeCustomer: {
		type: String,
		required: false,
	},
	stripeAmount: {
		type: Number,
		required: false,
	},
	currency: {
		type: String,
		required: false,
	},
})

module.exports = mongoose.model("Order", order)
