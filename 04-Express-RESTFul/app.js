const express = require('express')

const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const multer = require('multer')

const feedRouter = require('./routes/feed')
const authRouter = require('./routes/auth')

const { v4: uuidv4 } = require('uuid')
const app = express()

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images')
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4())
  },
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}
app.use(bodyParser.json()) // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'),
)

app.use('/images', express.static(path.join(__dirname, 'images')))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type , Authorization')
  next()
})

app.use('/feed', feedRouter)
app.use('/auth', authRouter)

app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode
  const message = error.message
  const data = error.data
  res.status(status).json({ message: message, data: data })
})
mongoose
  .connect('mongodb://localhost:27017')
  .then((result) => {
    app.listen(8080)
  })
  .catch((err) => console.log(err))
