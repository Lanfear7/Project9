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
            const user = await User.findOne({where: {emailAddress: credentials.name}});
            if(user){
                const userSecret = bcrypt.compareSync(credentials.pass, user.dataValues.password);
                if(userSecret){
                    req.currentUser = user;
                }
            }
        }
        next();
    }
}
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
        throw error = new Error('Query not found')
    }

}))

module.exports = router