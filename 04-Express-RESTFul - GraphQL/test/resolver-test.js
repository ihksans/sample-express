const expect = require('chai').expect
const sinon = require('sinon')
const authMiddleware = require('../middleware/auth')

const resolver = require('../graphql/resolvers')
const User = require('../models/user')
const Post = require('../models/post')
const { default: mongoose } = require('mongoose')

describe('Auth Resolver - Login', function () {
  before(function (done) {
    mongoose
      .connect(
        'mongodb+srv://shop:shop123@cluster0.8yioz.mongodb.net/test?authSource=admin&replicaSet=atlas-7mvi7l-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true',
      )
      .then((result) => {
        const user = new User({
          email: 'test@test.com',
          password: 'tester',
          name: 'Test',
          posts: [],
          _id: '5c0f66b979af55031b35728a',
        })
        return user.save()
      })
      .then(() => {
        done()
      })
  })
  it('should throw an error if accessing the database fails', function (done) {
    sinon.stub(User, 'findOne')
    User.findOne.throws()

    const req = {
      email: 'ihksanaa@gmail.com',
      password: 'ihksan123',
    }
    resolver
      .login(req, {}, () => {})
      .then((result) => {
        expect(result).to.be.an('error')
        expect(result).to.have.property('statusCode', 500)
      })
    User.findOne.restore()
    done()
  })
  it('should send a response with a valid user status for an existing user', function (done) {
    const req = { userId: '5c0f66b979af55031b35728a' }
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code
        return this
      },
      json: function (data) {
        this.userStatus = data.status
      },
    }
    resolver
      .getUserStatus(req, res, () => {})
      .then(() => {
        expect(res.statusCode).to.be.equal(200)
        expect(res.userStatus).to.be.equal('I am new!')
      })
    done()
  })
  it('should add a created post to the posts of creator', function (done) {
    const post = {
      postInput: {
        title: 'Test Post',
        content: 'A Test Post',
        imageUrl: 'abc',
        _id: '5c0f66b979af55031b35728b',
      },
    }
    const req = {
      userId: '5c0f66b979af55031b35728a',
      isAuth: true,
    }
    resolver
      .createPost(post, req, () => {})
      .then((result) => {
        console.log('asdasd', result._id)
        expect(result).to.have.property('result')
      })
    done()
  })
  // after(function (done) {
  //   // User.deleteMany({})
  //   //   .then(() => {
  //   //     // return mongoose.disconnect()
  //   //   })
  //   //   .then(() => {})
  //   done()
  // })
})
