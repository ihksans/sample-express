const { validationResult } = require('express-validator/check')
const post = require('../models/post')
const Post = require('../models/post')
const User = require('../models/user')
const path = require('path')
const fs = require('fs')

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1
  const perPage = 2
  try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find()
      .populate('creator')
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts: posts,
      totalItems: totalItems,
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect')
    error.statusCode = 422
    throw error
  }
  if (!req.file) {
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect',
      errors: errors.array(),
    })
  }
  const imageUrl = req.file.path.replace('\\', '/')
  const title = req.body.title
  const content = req.body.content
  let creator
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  })
  try {
    await post.save()
    user = await User.findById(req.userId)
    creator = user
    await user.posts.push(post)
    await user.save()
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: {
        _id: creator._id,
        name: creator.name,
      },
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId

  try {
    const post = await Post.findById(postId).populate('creator')
    if (!post) {
      const error = new Error('could not find post.')
      error.statusCode = 404
      throw error
    }
    res.status(200).json({
      message: 'Post fetched.',
      post: post,
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect')
    error.statusCode = 422
    throw error
  }
  const content = req.body.content
  const title = req.body.title
  let imageUrl = req.body.image
  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/')
  }
  if (!imageUrl) {
    const error = new Error('No file picked.')
    error.statusCode = 422
    throw error
  }

  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('could not find post.')
      error.statusCode = 404
      throw error
    }
    if (post.creator.toString() !== req.userId) {
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
    res.status(200).json({ message: 'Post updated!', post: await post.save() })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('could not find post.')
      error.statusCode = 404
      throw error
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorization!')
      error.statusCode = 401
      throw error
    }
    clearImage(post.imageUrl)
    await Post.findByIdAndRemove(postId)
    const userCurrent = await User.findById(req.userId)
    userCurrent.posts.pull(postId)
    await userCurrent.save()
    res.status(200).json({ message: 'Post deleted!' })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath)
  fs.unlink(filePath, (err) => console.log(err))
}
