'use strict'

module.exports = {
    up: function (queryInterface, Sequelize) {
        queryInterface.createTable('destinations',
            {
                weight : {
                    type          : Sequelize.STRING,
                    allowNull     : false
                },
                reference : {
                    type       : Sequelize.STRING,
                    allowNull  : false,
                    primaryKey : true
                },
                city : {
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
