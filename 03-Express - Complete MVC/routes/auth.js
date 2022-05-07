const express = require('express')
const { check, body } = require('express-validator/check')
const router = express.Router()
const authController = require('../controllers/auth')
const isAuth = require('../middleware/is-auth')
const User = require('../modals/user')

router.get('/login', authController.getLogin)
router.get('/signup', authController.getSignup)
router.get('/logout', isAuth, authController.postLogout)
router.get('/reset', authController.getReset)
router.get('/reset/:token', authController.getNewPassword)
router.post(
  '/login',
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value, { req }) => {
      return User.findOne({
        email: value,
      }).then((userDoc) => {
        if (!userDoc) {
          return Promise.reject('Invalid email or password')
        }
      })
    }),
  body(
    'password',
    'Please enter a new password with only numbers and text and at least 5 characters',
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  authController.postLogin,
)
router.post(
  '/signup',
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value, { req }) => {
      //   if (value === 'test@test.com') {
      //     throw new Error('this email address is forbidden.')
      //   }
      return User.findOne({
        email: value,
      }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject('Pick something different one email')
        }
      })
    }),
  body(
    'password',
    'Please enter a new password with only numbers and text and at least 5 characters',
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords have to match!')
    }
    return true
  }),
  authController.postSignup,
)
router.post('/logout', isAuth, authController.postLogout)
router.post('/reset', authController.postReset)
router.post('/new-password', authController.postNewPassword)

module.exports = router
