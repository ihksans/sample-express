import React, { Component, Fragment } from 'react'
import openSocket from 'socket.io-client'

import Post from '../../components/Feed/Post/Post'
import Button from '../../components/Button/Button'
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit'
import Input from '../../components/Form/Input/Input'
import Paginator from '../../components/Paginator/Paginator'
import Loader from '../../components/Loader/Loader'
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler'
import './Feed.css'

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
  }

  componentDidMount() {
    let graphQuery = {
      query: `
        query {
          getUserStatus{
            status
          }
        }
      `,
    }
    fetch('http://localhost:8080/graphql', {
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(graphQuery),
    })
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Fetching status failed!')
        }
        this.setState({ status: resData.data.getUserStatus.status })
      })
      .catch(this.catchError)

    this.loadPosts()
  }

  addPost = (post) => {
    this.setState((prevState) => {
      const updatedPosts = [...prevState.posts]
      if (prevState.postPage === 1) {
        if (prevState.posts.length >= 2) {
          updatedPosts.pop()
        }
        updatedPosts.unshift(post)
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1,
      }
    })
  }

  updatePost = (post) => {
    this.setState((prevState) => {
      const updatedPosts = [...prevState.posts]
      const updatedPostIndex = updatedPosts.findIndex((p) => p._id === post._id)
      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post
      }
      return {
        posts: updatedPosts,
      }
    })
  }
  loadPosts = (direction) => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] })
    }
    let page = this.state.postPage
    if (direction === 'next') {
      page++
      this.setState({ postPage: page })
    }
    if (direction === 'previous') {
      page--
      this.setState({ postPage: page })
    }
    let graphQuery = {
      query: `
        mutation GetPosts($page: Int!){
          getPosts(page: $page){
            posts {_id, content, title, imageUrl, creator {
              name
            }}
            totalItems
          }
        }
      `,
      variables: {
        page: page,
      },
    }
    fetch('http://localhost:8080/graphql', {
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(graphQuery),
    })
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Fetching posts failed!')
        }
        console.log('fetching posts: ', resData.data.getPosts.posts)
        this.setState({
          posts: resData.data.getPosts.posts.map((post) => {
            return {
              ...post,
              imagePath: post.imageUrl,
            }
          }),
          totalPosts: resData.data.getPosts.totalItems,
          postsLoading: false,
        })
      })
      .catch(this.catchError)
  }

  statusUpdateHandler = (event) => {
    event.preventDefault()
    let graphQuery = {
      query: `
        query UpdateUserStatus($status: String!) {
          updateUserStatus(status: $status){
            status
          }
        }
      `,
      variables: {
        status: this.state.status,
      },
    }
    fetch('http://localhost:8080/graphql', {
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(graphQuery),
    })
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Update status user failed!')
        }
        console.log(resData)
      })
      .catch(this.catchError)
  }

  newPostHandler = () => {
    this.setState({ isEditing: true })
  }

  startEditPostHandler = (postId) => {
    this.setState((prevState) => {
      const loadedPost = { ...prevState.posts.find((p) => p._id === postId) }

      return {
        isEditing: true,
        editPost: loadedPost,
      }
    })
  }

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null })
  }

  finishEditHandler = (postData) => {
    this.setState({
      editLoading: true,
    })
    const formData = new FormData()
    formData.append('image', postData.image)
    if (this.state.editPost) {
      formData.append('oldPath', this.state.editPost.imagePath)
    }
    fetch('http://localhost:8080/post-image', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((fileResData) => {
        const imageUrl = fileResData.filePath

        let graphQuery = {
          query: `
            mutation CreatePost($title: String!, $content: String!, $imageUrl: String!){
              createPost(postInput: {title: $title, content: $content, imageUrl: $imageUrl}){
                _id
                title
                content
                imageUrl
                creator {
                  name
                }
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            title: postData.title,
            content: postData.content,
            imageUrl: imageUrl,
          },
        }
        if (this.state.editPost) {
          graphQuery = {
            query: `
              mutation EditPost($title: String!, $content: String!, $imageUrl: String!, $postId: ID!){
                editPost(postInput: {title: $title, content: $content, imageUrl: $imageUrl}, postId: $postId){
                  _id
                title
                content
                imageUrl
                creator {
                  name
                }
                createdAt
                }
              }
            `,
            variables: {
              title: postData.title,
              content: postData.content,
              imageUrl: imageUrl,
              postId: this.state.editPost._id,
            },
          }
        }
        return fetch('http://localhost:8080/graphql', {
          method: 'POST',
          body: JSON.stringify(graphQuery),
          headers: {
            Authorization: 'Bearer ' + this.props.token,
            'Content-Type': 'application/json',
          },
        })
      })
      .then((res) => {
        console.log('result: ', res)
        return res.json()
      })
      .then((resData) => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet",
          )
        }
        if (resData.errors) {
          throw new Error('Creating a user failed!')
        }
        let resDataField = 'createPost'
        if (this.state.editPost) {
          resDataField = 'editPost'
        }
        const post = {
          _id: resData.data[resDataField]._id,
          title: resData.data[resDataField].title,
          content: resData.data[resDataField].content,
          creator: resData.data[resDataField].creator,
          createdAt: resData.data[resDataField].createdAt,
          imagePath: resData.data[resDataField].imageUrl,
        }
        this.setState((prevState) => {
          let updatedPosts = [...prevState.posts]
          let updatedTotalPosts = prevState.totalPosts
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              (p) => p._id === prevState.editPost._id,
            )
            updatedPosts[postIndex] = post
          } else {
            updatedTotalPosts++
            if (prevState.posts.length >= 2) {
              updatedPosts.pop()
            }
            updatedPosts.unshift(post)
          }
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false,
            totalPosts: updatedTotalPosts,
          }
        })
      })
      .catch((err) => {
        console.log(err)
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err,
        })
      })
  }

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value })
  }

  deletePostHandler = (postId) => {
    this.setState({ postsLoading: true })
    let graphQuery = {
      query: `
        mutation DeletePost($postId: ID!){
          deletePost(postId: $postId){
           message
          }
        }
      `,
      variables: {
        postId: postId,
      },
    }
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      body: JSON.stringify(graphQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Creating a user failed!')
        }
        let resDataField = 'createdPost'
        if (this.state.editPost) {
          resDataField = 'updatePost'
        }
        console.log(resData)
        this.loadPosts()
      })
      .catch((err) => {
        console.log(err)
        this.setState({ postsLoading: false })
      })
  }

  errorHandler = () => {
    this.setState({ error: null })
  }

  catchError = (error) => {
    this.setState({ error: error })
  }

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map((post) => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    )
  }
}

export default Feed
