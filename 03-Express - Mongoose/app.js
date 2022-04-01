const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const errorController = require('./controllers/error')
const User = require('./modals/user')
const app = express()

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')
const user = require('./modals/user')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use((req, res, next) => {
  User.findById('62455670e6c8e94add54ee15')
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
app.use(errorController.get404)

mongoose
  .connect(
    'mongodb+srv://shop:shop123@cluster0.8yioz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
  )
  .then(() => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: 'isan',
          email: 'isan@test',
          cart: {
            item: [],
          },
        })
        user.save()
      }
    })
  })
  .then(() => app.listen(3000))
  .catch((err) => {
    console.log(err)
  })
