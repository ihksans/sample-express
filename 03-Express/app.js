const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')

const errorController = require('./controllers/error')
const sequelize = require('./util/database')
const Product = require('./modals/product')
const User = require('./modals/user')
const Cart = require('./modals/cart')
const CartItem = require('./modals/cart-item')
const Order = require('./modals/order')
const OrderItem = require('./modals/order-item')
const app = express()

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user
      next()
    })
    .catch((err) => {
      console.log(err)
    })
})
app.use('/admin', adminRoutes)
app.use(shopRoutes)

Product.belongsTo(User, { constrains: true, onDelete: 'CASCADE' })
User.hasMany(Product)
User.hasOne(Cart)
Cart.belongsTo(User)
Cart.belongsToMany(Product, { through: CartItem })
Product.belongsToMany(Cart, { through: CartItem })
Order.belongsTo(User)
User.hasMany(Order)
Order.belongsToMany(Product, { through: OrderItem })
app.use(errorController.get404)
sequelize
  .sync()
  // .sync({ force: true })
  .then((result) => {
    return User.findByPk(1)
  })
  .then((user) => {
    if (!user) {
      return User.create({
        name: 'Admin',
        email: 'Admin@gmail.com',
        password: '12345',
      })
    }
    return user
  })
  .then((user) => {
    return user.createCart()
  })
  .then((cart) => {
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })
