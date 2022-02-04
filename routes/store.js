const Product = require("../models/product")
const express = require("express")
const router = express.Router()

router.use(function middleware(req, res, next) {
	next()
})
// ---------------------------------  DISPLAY ---------------------------------------------
router.get("/get-product/:reference", async (req, res) => {
	const reference = req.params.reference
	try {
		Product.find({})
			.where("reference")
			.equals(reference)
			.exec(function (err, response) {
				res.send(response)
			})
	} catch (err) {
		console.log(err)
	}
})
router.get("/get-categorie/:categorie", async (req, res) => {
	const categorie = req.params.categorie
	try {
		Product.find({})
			.where("categorie")
			.equals(categorie)
			.exec(function (err, response) {
				res.send(response)
			})
	} catch (err) {
		console.log(err)
	}
})
// ---------------------------------  ADMIN ---------------------------------------------
router.post("/create-product", async (req, res) => {
	const newId = req.body.id
	const newName = req.body.name
	const newLocation = req.body.location
	const newDescription = req.body.description
	const newReference = req.body.reference
	const newCategorie = req.body.categorie
	const newCategorieText = req.body.categorieText
	const newGallery = req.body.gallery
	const newGalleryText = req.body.galleryText
	const newAttachment = req.body.attachment
	const newUrl = req.body.url
	const newCamera = req.body.camera
	const newLens = req.body.lens
	const newAperture = req.body.aperture
	const newShutterSpeed = req.body.shutterSpeed
	const newFocalLenght = req.body.focalLenght
	const newHeight = req.body.height
	const newWidth = req.body.width
	const newSize = req.body.size
	const newCanvas = req.body.canvas
	const newDigital = req.body.digital
	const newMetal = req.body.metal
	const newPaper = req.body.paper
	const newLarge = req.body.large
	const newMedium = req.body.medium
	const newStandard = req.body.standard
	const newProduct = new Product({
		id: newId,
		name: newName,
		location: newLocation,
		description: newDescription,
		reference: newReference,
		categorie: newCategorie,
		categorieText: newCategorieText,
		gallery: newGallery,
		galleryText: newGalleryText,
		attachment: newAttachment,
		url: newUrl,
		camera: newCamera,
		lens: newLens,
		aperture: newAperture,
		shutterSpeed: newShutterSpeed,
		focalLenght: newFocalLenght,
		height: newHeight,
		width: newWidth,
		size: newSize,
		canvas: newCanvas,
		digital: newDigital,
		metal: newMetal,
		paper: newPaper,
		large: newLarge,
		medium: newMedium,
		standard: newStandard,
	})
	try {
		await newProduct.save()
		res.send("Your new Product has been successfuly created")
	} catch (err) {
		console.log(err)
		res.send(
			"Ooops, something wrong happened, try again to create your new product",
		)
	}
})
router.put("/edit-product", async (req, res) => {
	const idProduct = req.body.idProduct
	const newId = req.body.id
	const newName = req.body.name
	const newLocation = req.body.location
	const newDescription = req.body.description
	const newReference = req.body.reference
	const newCategorie = req.body.categorie
	const newCategorieText = req.body.categorieText
	const newGallery = req.body.gallery
	const newGalleryText = req.body.galleryText
	const newUrl = req.body.url
	const newCamera = req.body.camera
	const newLens = req.body.lens
	const newAperture = req.body.aperture
	const newShutterSpeed = req.body.shutterSpeed
	const newFocalLenght = req.body.focalLenght
	const newHeight = req.body.height
	const newWidth = req.body.width
	const newSize = req.body.size
	const newCanvas = req.body.canvas
	const newDigital = req.body.digital
	const newMetal = req.body.metal
	const newPaper = req.body.paper
	const newLarge = req.body.large
	const newMedium = req.body.medium
	const newStandard = req.body.standard
	try {
		await Product.findById(idProduct, function (err, response) {
			if (err) {
				res.send(
					"Ooops, something wrong happened, try again to update your new product",
				)
			}
			if (response) {
				response.id = newId
				response.name = newName
				response.location = newLocation
				response.description = newDescription
				response.reference = newReference
				response.categorie = newCategorie
				response.categorieText = newCategorieText
				response.gallery = newGallery
				response.galleryText = newGalleryText
				response.url = newUrl
				response.camera = newCamera
				response.lens = newLens
				response.aperture = newAperture
				response.shutterSpeed = newShutterSpeed
				response.focalLenght = newFocalLenght
				response.height = newHeight
				response.width = newWidth
				response.size = newSize
				response.canvas = newCanvas
				response.digital = newDigital
				response.metal = newMetal
				response.paper = newPaper
				response.large = newLarge
				response.medium = newMedium
				response.standard = newStandard
				response.save()
				res.send("Your product has been successfuly updated")
			}
		})
	} catch (err) {
		console.log(err)
	}
})
router.delete("/delete-product/:id", async (req, res) => {
	const id = req.params.id
	try {
		await Product.findByIdAndRemove(id).exec()
		res.send("deleted")
	} catch (err) {
		console.log(err)
	}
})

module.exports = router
