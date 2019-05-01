const mongo = require('@rd/mongo');
const config = require('@rd/config');

module.exports = async function(ctx,next){
    if(ctx.session.user) return next();
    var token = ctx.cookies.get(config.cookies.longTerm.name,[{signed:true}]);
    if(token){
        var res = await mongo.session.findByIdAndUpdate(token,{date:Date.now}).lean();
        if(res !=null ) ctx.session.user =  res.user;
    }
    return next();
}