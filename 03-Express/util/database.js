const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient

let _db
const mongoConnect = (callback) => {
  MongoClient.connect(
    'mongodb+srv://shop:shop123@cluster0.8yioz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
  )
    .then((client) => {
      console.log('Connect mongodb')
      _db = client.db()
      callback()
    })
    .catch((err) => {
      console.log(err)
    })
}

const getDb = () => {
  if (_db) {
    return _db
  }
  throw 'No database found'
}
exports.mongoConnect = mongoConnect
exports.getDb = getDb
