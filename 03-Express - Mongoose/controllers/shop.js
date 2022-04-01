const Product = require('../modals/product')
const Order = require('../modals/order')

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All products',
        path: '/products',
      })
    })
    .catch((err) => console.log(err))
}

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      })
    })
    .catch((err) => console.log(err))
}

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
      })
    })
    .catch((err) => console.log(err))
}

exports.getCart = async (req, res, next) => {
  await req.user
    .populate('cart.items.productId')
    .then((user) => {
      console.log(user.cart.items)
      const products = user.cart.items
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      })
    })
    .catch((err) => console.log(err))
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product)
    })
    .then((result) => {
      console.log(result)
      res.redirect('/cart')
    })
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout',
  })
}

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res
        .render('shop/orders', {
          pageTitle: 'Your Orders',
          path: '/orders',
          orders: orders,
        })
        .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect('/cart')
    })
    .catch((err) => console.log(err))
}

exports.postOrder = async (req, res, next) => {
  await req.user
    .populate('cart.items.productId')
    .then((user) => {
      console.log(user.cart.items)
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } }
      })
      console.log('product order: ', products)

      const order = new Order({
        user: { name: req.user.name, userId: req.user },
        products: products,
      })
      return order.save()
    })
    .then((result) => {
      req.user.clearCart()
    })
    .then(() => {
      res.redirect('/orders')
    })
    .catch((err) => console.log(err))
}
