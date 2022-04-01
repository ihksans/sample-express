const Product = require('../modals/product')
exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-edit-product', {
    path: '/admin/add-product',
    pageTitle: 'Add Product',
    editing: false,
  })
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title
  const imageUrl = req.body.imageUrl
  const description = req.body.description
  const price = req.body.price
  console.log('user Id:', req.user)
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
      console.log(err)
    })
}
exports.getEditProduct = (req, res, next) => {
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
      })
    })
    .catch((err) => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId
  const updatedTitle = req.body.title
  const updatedPrice = req.body.price
  const updatedImageUrl = req.body.imageUrl
  const updatedDesc = req.body.description
  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle
      product.description = updatedDesc
      product.price = updatedPrice
      product.imageUrl = updatedImageUrl
      return product.save()
    })
    .then((result) => {
      console.log('Updated Product')
      res.redirect('/admin/products')
    })
    .catch((err) => console.log(err))
}

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render('admin/product-list', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      })
    })
    .catch((err) => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.findByIdAndRemove(prodId)
    .then(() => {
      console.log('Destroyed Product 2')
      res.redirect('/admin/products')
    })
    .catch((err) => console.log(err))
}
