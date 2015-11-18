'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('itineraryPlaces',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        itineraryId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'itineraries',
            key   : 'id'
          },
          allowNull : false
        },
        placeId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'places',
            key   : 'id'
          },
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
    queryInterface.dropTable('itineraryPlaces')
  }
};
