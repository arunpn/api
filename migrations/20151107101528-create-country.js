'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('countries',
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
        code : {
          type      : Sequelize.STRING,
          allowNull : false
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
    queryInterface.dropTable('countries')
  }
};
