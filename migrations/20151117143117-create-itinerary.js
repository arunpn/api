'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        queryInterface.createTable('itineraries',
            {
                id : {
                    type          : Sequelize.INTEGER,
                    primaryKey    : true,
                    autoIncrement : true
                },
                userId : {
                    type       : Sequelize.INTEGER,
                    references : {
                        model : 'users',
                        key   : 'id'
                    },
                    allowNull : false
                },
                cityId : {
                    type       : Sequelize.INTEGER,
                    references : {
                        model : 'cities',
                        key   : 'id'
                    },
                    allowNull : false
                },
                name : {
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
        queryInterface.dropTable('itineraries')
    }
};
