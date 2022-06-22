const authMiddleware = require('../middleware/auth')
const expect = require('chai').expect
const jwt = require('jsonwebtoken')
const sinon = require('sinon')

it('should not to throw an error if no authorization header is present', function () {
  const req = {
    get: function (headerName) {
      return null
    },
  }
  expect(
    authMiddleware.bind(this, req, {}, (result) => {
      expect(req).to.have.property('isAuth', false)
    }),
  ).not.to.throw()
})

it('should yoield a userId after decoding the token', function () {
  const req = {
    get: function (headerName) {
      return 'Bearer aksjdkaksdjkaskdnaksdkj'
    },
  }
  sinon.stub(jwt, 'verify')

  jwt.verify.returns({ userId: 'abc' })
  authMiddleware(req, {}, () => {})
  expect(req).to.have.property('userId')
  expect(req).to.have.property('userId', 'abc')
  expect(jwt.verify.called).to.be.true
  jwt.verify.restore()
})
