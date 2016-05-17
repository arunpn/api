'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('places',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        cityId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'cities',
            key   : 'id'
          }
        },
        name : {
          type       : Sequelize.STRING,
          allowNull  : false
        },
        latitude : {
          type      : Sequelize.DOUBLE,
          allowNull : false
        },
        longitude : {
          type      : Sequelize.DOUBLE,
          allowNull : false
        },
        address : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        postcode : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        email : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        website : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        telephone : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        factualId : {
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
    queryInterface.dropTable('places')
  }
}
