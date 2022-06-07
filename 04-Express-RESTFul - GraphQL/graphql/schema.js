const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: UserShortDetail!
        createdAt: String!
        updatedAt: String!
    }
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    type UserShortDetail {
        _id: ID!
        name: String!
        status: String!
        posts: [Post!]!
    }
    
    type AuthData{
        token: String!
        userId: String!
    }

    type UserStatus{
        status: String!
    }

    type Message{
        message: String!
    }

    type PostsPagination{
        posts:  [Post!]!
        totalItems: Int!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    input PaginationInput {
        page: Int!
    }

    type RootQuery {
        login(email: String!, password: String!):  AuthData!
        getUserStatus: UserShortDetail!
        updateUserStatus(status: String!): UserShortDetail!
    }

    type RootMutation{
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        editPost(postInput: PostInputData, postId: ID!): Post!
        deletePost(postId: ID!): Message!
        getPosts(page: Int!): PostsPagination!
        getPost(postId: ID!): Post!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)
