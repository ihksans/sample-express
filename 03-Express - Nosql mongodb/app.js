const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')

const errorController = require('./controllers/error')
const mongoConnect = require('./util/database').mongoConnect
const User = require('./modals/user')
const app = express()

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use((req, res, next) => {
  User.findById('6243d92ca259e4c68a7478f8')
    .then((user) => {
      req.user = new User(user.name, user.email, user.cart, user._id)
      next()
    })
    .catch((err) => {
      console.log(err)
    })
})
app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(errorController.get404)

mongoConnect(() => {
  app.listen(3000)
})
