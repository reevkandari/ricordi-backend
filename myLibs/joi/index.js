const Joi = require('joi');

const signup = Joi.object().keys({
    fullname: Joi.string().min(5).max(30).required(),
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string().required()
});
const login = Joi.object().keys({
    accName: Joi.string().alphanum().min(5).required(),
    password: Joi.string().required()
});


const schema = {
    login,
    signup
}

module.exports = async function(ctx,next){
    if(ctx.path=='/') return next();
    var path = ctx.path.replace('/','');
    console(path);
    var pathSchema = eval('schema.'+path);
    if(pathSchema){
        if(ctx.request.body == null) ctx.throw(400,'You seem to be sending some wrong Data');
        else{
            var result = await Joi.validate(ctx.body,pathSchema);
            console.log(result);
            if(result.error) ctx.throw(400,'You seem to be sending some wrong Data');
            else return next();
        }
    }else return next();
}