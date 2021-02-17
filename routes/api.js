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
        let err;
        const credentials = auth(req);
        if(credentials){
            const user = await User.findOne({where: {emailAddress: credentials.name}});
            if(user){
                const userSecret = bcrypt.compareSync(credentials.pass, user.dataValues.password);
                if(userSecret){
                    req.currentUser = user;
                }else{
                    err = `Password did not match.`
                }
            }else{
                err = `No user was found.`
            }
        }else {
            err = `Auth header was not found.`
        }
        if(err){
            console.log(err)
            res.json({err}).status(401)
        }
        next();
    }
}
router.get('/users', authenticateUser(), asyncHandler(async(req, res, next) => {
    console.log(req.currentUser)
    res.json(req.currentUser).status(200)
}))

router.post('/users', asyncHandler(async(req, res) => {
    try{
        if(req.body.firstName && req.body.lastName && req.body.emailAddress && req.body.password){
            await User.create(req.body)
            res.location("/").sendStatus(200).end()
        }else{
            throw error = new Error('Missing a body requirement')
        }
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

router.get("/courses", async (req, res) => {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: "User",
          attributes:['firstName','lastName','emailAddress', 'password'] //This will only return these attributes from the associated model 
        },
      ]
    });
    res.json(courses).status(200);
});

router.post('/courses', authenticateUser(),asyncHandler(async(req, res) => {
    try{
        if(req.body.title && req.body.description){
            await Course.create(req.body)
            res.sendStatus(201)
        } else{
            throw error = new Error('No Title or Description was provided')
        }   
    }catch(error){
        res.sendStatus(400)
        throw error
        
    }
}))

router.get('/courses/:id', asyncHandler(async(req, res) => {
    let course = await Course.findByPk(req.params.id)
    if(course){
        course = await Course.findByPk(req.params.id, {
            include: [
              {
                model: User,
                as: "User",
                attributes: ['firstName','lastName','emailAddress', 'password'] //This will only return these attributes from the associated model 
              },
            ]
          })
        res.json(course).status(200)
    }else{
        res.sendStatus(400)
        throw error = new Error('Query not found')
    }
}));

router.put('/courses/:id', authenticateUser(),asyncHandler(async(req, res) => {
    let err;
    if(req.body.title && req.body.description){
        let course = await Course.findByPk(req.params.id)
        if(course){
            await course.update(req.body)
            res.sendStatus(204)
        }else{
            throw error = new Error('Query not found')
        }  
    }else{
        err = `No Title or Description was provided`
    }
    if(err){
        res.json({err}).status(400)
    }
    
}))

router.delete('/courses/:id', authenticateUser(),asyncHandler(async(req, res) => {
    let course = await Course.findByPk(req.params.id)
    if(course){
        await course.destroy()
        res.sendStatus(204)
    }else{
        throw error = new Error('Query not found')
    }
}))

module.exports = router