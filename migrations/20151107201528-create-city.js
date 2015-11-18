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
        reference : {
          type       : Sequelize.STRING,
          allowNull  : false,
          primaryKey : true
        },
        name : {
          type       : Sequelize.STRING,
          allowNull  : false
        },
        country : {
          type      : Sequelize.STRING,
          allowNull : false
        },
        region : {
          type      : Sequelize.STRING,
          allowNull : true
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
