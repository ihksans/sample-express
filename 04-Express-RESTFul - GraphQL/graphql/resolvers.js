const User = require('../models/user')
const Post = require('../models/post')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const { default: validator } = require('validator')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator/check')
module.exports = {
  createUser: async function ({ userInput }, req) {
    try {
      const errors = []
      if (!validator.isEmail(userInput.email)) {
        errors.push({ message: 'E-mail is invalid' })
      }
      const test = validator.isEmail(userInput.email)
      if (
        validator.isEmpty(userInput.password) ||
        !validator.isLength(userInput.password, { min: 5 })
      ) {
        errors.push({ message: 'Password too short!' })
      }
      if (errors.length > 0) {
        const error = new Error('Invalid input.')
        error.data = errors
        error.code = 422
        throw error
      }
      const existingUser = await User.findOne({ email: userInput.email })
      if (existingUser) {
        const error = new Error('User exists ready!')
        throw error
      }
      const hashedPW = await bcrypt.hash(userInput.password, 12)
      const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPW,
      })
      const createdUser = await user.save()
      return { ...createdUser._doc, _id: createdUser._id.toString() }
    } catch (err) {
      if (!err.status) {
        err.code = 500
      }
      throw err
    }
  },
  login: async function ({ email, password }, next) {
    try {
      const user = await User.findOne({
        email: email,
      })
      if (!user) {
        const error = new Error('A user with this email could not be found')
        error.code = 401
        throw error
      }
      loadedUser = user
      const isEqual = await bcrypt.compare(password, user.password)
      if (!isEqual) {
        const error = new Error('Wrong password!')
        error.code = 401
        throw error
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        'secretsupersecretsecret',
        { expiresIn: '1h' },
      )
      return { token: token, userId: loadedUser._id.toString() }
    } catch (err) {
      if (!err.status) {
        err.code = 500
      }
      throw err
    }
  },
  getUserStatus: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticate')
      error.code = 401
      throw error
    }

    try {
      console.log('user id: ', req.userId)
      const user = await User.findById(req.userId)
      if (!user) {
        const error = new Error('User not found.')
        error.code = 404
        throw error
      }
      return { _id: user._id, name: user.name, status: user.status }
    } catch (err) {
      if (!err.status) {
        err.code = 500
      }
      throw err
    }
  },
  updateUserStatus: async function ({ status }, req) {
    try {
      const user = await User.findById(req.userId)
      if (!user) {
        const error = new Error('User not found.')
        error.code = 404
        throw error
      }
      user.status = status
      await user.save()
      return { _id: user._id, name: user.name, status: user.status }
    } catch (err) {
      if (!err.status) {
        err.code = 500
      }
      throw err
    }
  },

  createPost: async function ({ postInput }, req, next) {
    console.log('auth status', req.isAuth)
    if (!req.isAuth) {
      const error = new Error('Not Authenticate')
      error.code = 401
      throw error
    }

    const errors = []
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid!' })
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid!' })
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input.')
      error.data = errors
      error.code = 422
      throw error
    }

    // const imageUrl = postInput.imageUrl.replace('\\', '/')
    const imageUrl = postInput.imageUrl
    const title = postInput.title
    const content = postInput.content
    let creator

    try {
      const user = await User.findById(req.userId)
      const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: user,
      })
      const result = await post.save()
      creator = user
      await user.posts.push(post)
      await user.save()
      return {
        ...result._doc,
        _id: result._id.toString(),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      throw err
    }
  },

  getPosts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticate')
      error.code = 401
      throw error
    }

    const currentPage = page || 1
    const perPage = 2
    try {
      const totalItems = await Post.find().countDocuments()
      const posts = await Post.find()
        .populate('creator')
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
      return { ...posts, posts: posts, totalItems: totalItems }
    } catch (err) {
      if (!err.status) {
        err.code = 500
      }
      throw err
    }
  },

  getPost: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticate')
      error.code = 401
      throw error
    }
    console.log('post Id', postId)
    try {
      const post = await Post.findById(postId).populate('creator')
      if (!post) {
        const error = new Error('could not find post.')
        error.code = 404
        throw error
      }
      console.log('post', post.content)

      return {
        _id: post._id.toString(),
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        creator: post.creator,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }
    } catch (err) {
      if (!err.status) {
        err.code = 500
      }
      throw err
    }
  },

  editPost: async function ({ postInput, postId }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticate')
      error.code = 401
      throw error
    }

    const errors = []
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid!' })
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid!' })
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input.')
      error.data = errors
      error.code = 422
      throw error
    }

    const content = postInput.content
    const title = postInput.title
    let imageUrl = postInput.imageUrl
    try {
      const post = await Post.findById(postId).populate('creator')
      if (!post) {
        const error = new Error('could not find post.')
        error.statusCode = 404
        throw error
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error('Not authorization!')
        error.statusCode = 401
        throw error
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl)
      }
      post.title = title
      post.imageUrl = imageUrl
      post.content = content

      const result = await post.save()

      return {
        ...result._doc,
        _id: result._id.toString(),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      throw err
    }
  },

  deletePost: async function ({ postId }, req) {
    try {
      const post = await Post.findById(postId)
      if (!post) {
        const error = new Error('could not find post.')
        error.code = 404
        throw error
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorization!')
        error.code = 401
        throw error
      }
      clearImage(post.imageUrl)
      await Post.findByIdAndRemove(postId)
      const userCurrent = await User.findById(req.userId)
      userCurrent.posts.pull(postId)
      await userCurrent.save()
      return { message: 'Remove post success' }
    } catch (err) {
      if (!err.statusCode) {
        err.code = 500
      }
      throw error
    }
  },
}

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath)
  fs.unlink(filePath, (err) => console.log(err))
}
