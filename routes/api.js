const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const {sequelize, User, Course} = require('../models')

asyncHandler = (cb) => {
    return async(req, res, next) => {
        try{
            await cb(req, res, next)
        }catch(error){
            next(error)
        }
    }
}

authenticateUser = () => {
    return async(req, res, next) =>{
        const credentials = auth(req);
        if(credentials){
            console.log('got credentials')
            const user = await User.findOne({where: {emailAddress: credentials.name}});
            if(user){
                console.log('found user')
                console.log(credentials.pass)
                console.log(user.dataValues.password)
                const userSecret = bcrypt.compareSync(credentials.pass, user.dataValues.password);
                if(userSecret){
                    console.log('found pass')
                    req.currentUser = user;
                }
            }
        }
        next();
    }
}

router.get('/users', authenticateUser(), asyncHandler(async(req, res, next) => {
    console.log(req.currentUser)
}))

router.post('/users', asyncHandler(async(req, res) => {
    try{
        console.log(req.body)
        await User.create(req.body)
        res.sendStatus(200);
    }catch(error){
        if(error.name === 'SequelizeValidationError'){
            let errors = []
            error.errors.forEach(err =>  errors.push(err.message))
            res.json({errors}).status(400)
        } else {
            throw error;
        }
        
    }
    
}))

module.exports = router