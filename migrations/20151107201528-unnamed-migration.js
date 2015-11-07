'use strict'

module.exports = {
    up: function (queryInterface, Sequelize) {
        queryInterface.createTable('destinations',
            {
                city : {
                    type       : Sequelize.STRING,
                    allowNull  : false,
                    primaryKey : true
                },
                country : {
                    type      : Sequelize.STRING,
                    allowNull : false,
                    primaryKey : true
                },
                region : {
                    type      : Sequelize.STRING,
                    allowNull : true
                },
                image : {
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
        queryInterface.dropTable('destinations')
    }
}
