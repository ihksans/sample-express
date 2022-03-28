const Product = require('../modals/product')
const Cart = require('../modals/cart')
exports.getProducts = (req, res, next) => {
  const products = Product.fetchAll((products) => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All products',
      path: '/products',
    })
  })
}

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId
  Product.findById(prodId, (product) => {
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products',
    })
  })
}

exports.getIndex = (req, res, next) => {
  const products = Product.fetchAll((products) => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
    })
  })
}

exports.getCart = (req, res, next) => {
  Cart.getCart((cart) => {
    const products = Product.fetchAll((products) => {
      const cartProducts = []
      for (product of products) {
        const cartProductData = cart.products.find(
          (prod) => prod.id === product.id,
        )
        if (cartProductData) {
          cartProducts.push({ productData: product, qty: cartProductData.qty })
        }
      }
      res.render('shop/cart', {
        products: cartProducts,
        pageTitle: 'Your Cart',
        path: '/cart',
      })
    })
  })
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId
  Product.findById(prodId, (product) => {
    Cart.addProduct(prodId, product.price)
  })
  res.redirect('/cart')
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout',
  })
}

exports.getOrders = (req, res, next) => {
  const products = Product.fetchAll((products) => {
    res.render('shop/orders', {
      prods: products,
      pageTitle: 'Your Orders',
      path: '/orders',
    })
  })
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.findById(prodId, (product) => {
    Cart.deleteProduct(prodId, product.price)
    res.redirect('/cart')
  })
}
