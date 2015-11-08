'use strict'

module.exports = {
    up: function (queryInterface, Sequelize) {
        queryInterface.createTable('placeImages',
            {
                id : {
                    type          : Sequelize.INTEGER,
                    primaryKey    : true,
                    autoIncrement : true
                },
                placePlace : {
                    type       : Sequelize.STRING,
                    references : {
                        model : 'places',
                        key   : 'place'
                    }
                },
                url : {
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
        queryInterface.dropTable('placeImages')
    }
}
