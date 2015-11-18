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
        rating : {
          type      : Sequelize.INTEGER,
          allowNull : true
        },
        reviewText : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        reviewImage : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        reviewCount : {
          type      : Sequelize.INTEGER,
          allowNull : true
        },
        telephone : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        latitude : {
          type      : Sequelize.DOUBLE,
          allowNull : false
        },
        longitude : {
          type      : Sequelize.DOUBLE,
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
    queryInterface.dropTable('places')
  }
}
