const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
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
router.get('/', (req, res)=> {
    console.log('main api')
    res.sendStatus(200)
})

router.get('/users', authenticateUser(), asyncHandler(async(req, res, next) => {
    res.json(req.currentUser.dataValues).status(200)
}))

router.post('/users', asyncHandler(async(req, res) => {
    try{
        await User.create(req.body)
        res.location("/").sendStatus(200).end()
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