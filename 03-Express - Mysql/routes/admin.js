const path = require('path')
const express = require('express')
const adminController = require('../controllers/admin')
const router = express.Router()

// GET /admin/add-product
router.get('/add-product', adminController.getAddProduct)
// GET
router.get('/products', adminController.getProducts)

// POST /admin/add-product
router.post('/add-product', adminController.postAddProduct)

router.get('/add-edit-product/:productId', adminController.getEditProduct)

router.post('/add-edit-product', adminController.postEditProduct)

router.post('/delete-product', adminController.postDeleteProduct)

module.exports = router
