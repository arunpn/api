'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('cities',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        name : {
          type       : Sequelize.STRING,
          allowNull  : false
        },
        countryId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'countries',
            key   : 'id'
          }
        },
        picture : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        createdAt : {
          type : Sequelize.DATE
        },
        updatedAt : {
          type : Sequelize.DATE
        }
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('cities')
  }
}
