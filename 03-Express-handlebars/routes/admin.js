const path = require('path')
const express = require('express')
const router = express.Router()
const rootDir = require('../util/path')
const products = []
// GET /admin/add-product
router.get('/add-product', (req, res, next) => {
  // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
  res.render('add-product', {
    path: '/admin/add-product',
    pageTitle: 'Add Product',
    formCSS: true,
    productCSS: true,
    activeAddProduct: true,
  })
})

// POST /admin/add-product
router.post('/add-product', (req, res, next) => {
  products.push({ title: req.body.title })
  res.redirect('/')
})

exports.routes = router
exports.products = products
