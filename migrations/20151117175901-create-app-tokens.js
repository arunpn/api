'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('appTokens',
      {
        id: {
          type          : Sequelize.STRING,
          primaryKey    : true
        },
        token: {
          type          : Sequelize.STRING
        },
        type: {
          type          : Sequelize.TEXT,
          allowNull     : true
        },
        expireAt: {
          type          : Sequelize.DATE,
          allowNull     : true
        },
        createdAt: {
          type          : Sequelize.DATE
        },
        updatedAt: {
          type          : Sequelize.DATE
        }
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('appTokens')
  }
}
