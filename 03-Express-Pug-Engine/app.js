const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const expressHbs = require('express-handlebars')
const app = express()

app.engine('handlebars', expressHbs())

app.set('view engine', 'pug')
app.set('views', 'views')

const adminData = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use(shopRoutes)
app.use('/admin', adminData.routes)

app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' })
})

app.listen(3000)
