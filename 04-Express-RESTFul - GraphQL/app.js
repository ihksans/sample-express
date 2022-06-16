const express = require('express')

const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/auth')
const { v4: uuidv4 } = require('uuid')
const app = express()

// File configuration
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
// configuration for secure response header
app.use(helmet())
// configuration for compress assets
app.use(compression())
// configuration for logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' },
)
app.use(morgan('combined', { stream: accessLogStream }))
app.use(bodyParser.json()) // request from application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'),
)

// image file directory
app.use('/images', express.static(path.join(__dirname, 'images')))

// CORS Configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type , Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// handle auth
app.use(auth)

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error('Not Authenticate')
    error.code = 401
    throw error
  }

  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' })
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  console.log('image path:', req.file.path)
  return res.status(201).json({
    message: 'File stored.',
    filePath: req.file.path.replace('\\', '/'),
  })
})

// configuration graphql
app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err
      }
      const data = err.originalError.data
      const message = err.message || 'An error occured.'
      const code = err.originalError.code || 500
      return { message: message, status: code, data: data }
    },
  }),
)

// handle error when issue on server
app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode
  const message = error.message
  const data = error.data
  res.status(status).json({ message: message, data: data })
})

// configuration server
mongoose
  .connect(
    'mongodb+srv://shop:shop123@cluster0.8yioz.mongodb.net/myFirstDatabase?authSource=admin&replicaSet=atlas-7mvi7l-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true',
  ) //connect to mongo db
  .then((result) => {
    app.listen(process.env.PORT || 3000)
  })
  .catch((err) => console.log(err))

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath)
  fs.unlink(filePath, (err) => console.log(err))
}
