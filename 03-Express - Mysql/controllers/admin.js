const Product = require('../modals/product')

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-edit-product', {
    path: '/admin/add-product',
    pageTitle: 'Add Product',
    editing: false,
  })
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit
  if (!editMode) {
    return res.redirect('/')
  }
  const prodId = req.params.productId
  Product.findById(prodId, (product) => {
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
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId
  const updatedTitle = req.body.title
  const updatedPrice = req.body.price
  const updatedImageUrl = req.body.imageUrl
  const updatedDesc = req.body.description
  const updatedProduct = new Product(
    prodId,
    updatedTitle,
    updatedImageUrl,
    updatedDesc,
    updatedPrice,
  )
  updatedProduct.save()
  res.redirect('/admin/products')
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title
  const imageUrl = req.body.imageUrl
  const description = req.body.description
  const price = req.body.price
  const product = new Product(null, title, imageUrl, description, price)
  product
    .save()
    .then(() => {
      res.redirect('/')
    })
    .catch((err) => console.log(err))
}

exports.getProducts = (req, res, next) => {
  Product.fetchAll((products) => {
    res.render('admin/product-list', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
    })
  })
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.deleteById(prodId)
  res.redirect('/admin/products')
}
