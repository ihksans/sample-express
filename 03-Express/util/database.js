const Sequelize = require('sequelize')

const sequelize = new Sequelize('node_complete', 'root', null, {
  dialect: 'mysql',
  host: 'localhost',
})

module.exports = sequelize
