const fs = require('fs')
const path = require('path')
const Product = require('../modals/product')
const Order = require('../modals/order')
const PDFDocument = require('pdfkit')

const ITEMS_PER_PAGE = 1
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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
  const page = +req.query.page || 1
  let totalItems
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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
      res.render('shop/orders', {
        pageTitle: 'Your Orders',
        path: '/orders',
        orders: orders,
      })
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
        user: { email: req.user.email, userId: req.user },
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

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error('No order found'))
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'))
      }
      const invoiceName = 'invoice-' + orderId + '.pdf'
      const invoicePath = path.join('data', 'invoices', invoiceName)

      const pdfDoc = new PDFDocument()
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"',
      )
      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      pdfDoc.pipe(res)
      pdfDoc.fontSize(26).text('Invoice')
      pdfDoc.text('--------------------------')
      let totalPrice = 0
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price
        pdfDoc
          .fontSize(10)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x ' +
              prod.product.price,
          )
      })
      pdfDoc.fontSize(14).text('Total Price: $' + totalPrice)

      pdfDoc.end()

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err)
      //   }
      // })
      // option 1 without stream
      // res.setHeader('Content-Type', 'application/pdf')
      // res.setHeader(
      //   'Content-Disposition',
      //   'inline; filename="' + invoiceName + '"',
      // )
      // res.send(data)
      // option 2 with stream
    })
    .catch((err) => console.log(err))
}

exports.getCheckout = async (req, res, next) => {
  await req.user
    .populate('cart.items.productId')
    .then((user) => {
      console.log(user.cart.items)

      const products = user.cart.items
      let totalSum = 0
      products.forEach((p) => {
        totalSum += p.quantity * p.productId.price
      })
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: totalSum,
      })
    })
    .catch((err) => console.log(err))
}
