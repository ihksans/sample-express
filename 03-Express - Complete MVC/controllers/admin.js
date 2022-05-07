const { validationResult } = require('express-validator/check')
const Product = require('../modals/product')
const fileHelper = require('../util/file')
exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-edit-product', {
    path: '/admin/add-product',
    pageTitle: 'Add Product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  })
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title
  const image = req.file
  const description = req.body.description
  const price = req.body.price
  console.log('file:', image)
  console.log('title:', title)

  if (!image) {
    return res.status(422).render('admin/add-edit-product', {
      path: '/admin/add-edit-product',
      pageTitle: 'Add Product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: 'Attached file is not an image 2',
      validationErrors: [],
    })
  }
  const errors = validationResult(req)
  console.log('errors:', errors)
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-edit-product', {
      path: '/admin/add-edit-product',
      pageTitle: 'Add Product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    })
  }
  const imageUrl = image.path
  console.log('image file:', image)
  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.user,
  })
  product
    .save()
    .then((result) => {
      console.log('Created Product')
      res.redirect('/admin/products')
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      console.log('error:', error)

      return next(error)
    })
}
exports.getEditProduct = (req, res, next) => {
  console.log('get edit proses')

  const editMode = req.query.edit
  if (!editMode) {
    return res.redirect('/')
  }
  const prodId = req.params.productId
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/')
      }
      res.render('admin/add-edit-product', {
        path: '/admin/add-edit-product',
        pageTitle: 'Edit Product',
        editing: editMode,
        product: product,
        errorMessage: null,
        hasError: false,
        validationErrors: [],
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId
  const updatedTitle = req.body.title
  const updatedPrice = req.body.price
  const image = req.file
  const updatedDesc = req.body.description
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    console.log('edit proses error')

    return res.status(422).render('admin/add-edit-product', {
      path: '/admin/add-edit-product',
      pageTitle: 'Edit Product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    })
  }
  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/')
      }
      product.title = updatedTitle
      product.description = updatedDesc
      product.price = updatedPrice
      if (image) {
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path
      }
      return product.save().then((result) => {
        console.log('Updated Product')
        res.redirect('/admin/products')
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

exports.getProducts = (req, res, next) => {
  // Product.find({ userId: req.user._id })
  Product.find()
    .then((products) => {
      res.render('admin/product-list', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found'))
      }
      fileHelper.deleteFile(product.imageUrl)
      return Product.deleteOne({ _id: prodId, userId: req.user._id })
    })
    .then(() => {
      console.log('Destroyed Product 2')
      res.status(200).json({ message: 'Success!' })
    })
    .catch((err) => {
      res.status(500).json({ message: 'Deleting product failed.' })
    })
}