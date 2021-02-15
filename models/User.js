const { Model } = require('sequelize');
const bcrypt = require('bcrypt')
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class User extends Sequelize.Model{}
    User.init({
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate:{
                notNull: {
                    msg: "Must provide a first name."
                }
            }
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate:{
                notNull: {
                    msg: "Must provide a last name."
                }
            }
        },
        emailAddress: {
            type: Sequelize.STRING,
            allowNull: false,
            validate:{
                notNull: {
                    msg: "Must provide a email address."
                }
            }
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
            set(val) {
                const hashedPass = bcrypt.hashSync(val, 10)
                this.setDataValue('password', hashedPass)
            },
            validate:{
                notNull: {
                    msg: "Must provide a password."
                }
            }
        }
    },{ sequelize });

    //DB association to the course module  
    User.associate = (models) => {
        User.hasMany(models.Course, {
            foreignKey: {
                fieldName: "user",
                allowNull: false,
            }
        })
    }
    return User;
}