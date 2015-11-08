'use strict'

module.exports = {
    up: function (queryInterface, Sequelize) {
        queryInterface.createTable('places',
            {
                weight : {
                    type          : Sequelize.STRING,
                    allowNull     : false
                },
                place : {
                    type       : Sequelize.STRING,
                    allowNull  : false,
                    primaryKey : true
                },
                destinationId : {
                    type       : Sequelize.STRING,
                    references : {
                        model : 'destinations',
                        key   : 'reference'
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
                review_text : {
                    type      : Sequelize.STRING,
                    allowNull : true
                },
                review_image : {
                    type      : Sequelize.STRING,
                    allowNull : true
                },
                review_count : {
                    type      : Sequelize.INTEGER,
                    allowNull : true
                },
                phone : {
                    type      : Sequelize.STRING,
                    allowNull : true
                },
                latitude : {
                    type      : Sequelize.STRING,
                    allowNull : false
                },
                longitude : {
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
        queryInterface.dropTable('places')
    }
}
