const Router = require('koa-router');
const router = new Router();
const mongo = require('@rd/mongo');
const mail = require('@rd/mail');
const config = require('@rd/config');
const bcrypt = require('bcryptjs');
var UAParser = require('ua-parser-js');
const uid = require('uid-safe');
const _ = require('lodash');


router.get('/', async ctx => {
    //await mongo.user.findByIdAndUpdate('5bd00a80abb62d2e7cbad4f7',{ 'stats.stories': 3 });
    ctx.body = await mongo.verify.find();
});

router.get('/find', async ctx => {
    ctx.body = 'Waah';
    //my id = 5bb3692c184df071406b9bee
    //ctx.body = await mongo.story.find({user:'5bb3692c184df071406b9bee'},'content');
    /*if('5bbef556dac0a37f537ea17a' > '5bbdfc7a8b9db6564b392a80'){
        ctx.body = 'new one is bigger';
    }else{
        ctx.body = 'old one is bigger   ';
    }*/
    /*ctx.body = await mongo.story.updateMany({},{
        //"stats.following": 0 ,
        //"stats.followers": 0 ,
        $unset: {'anonymous': 1 }}
        );
        //*/
    //ctx.body = await mongo.story.find().sort('-createdAt');
    //ctx.body = await mongo.user.update({'email':'reevkandari@gmail.com'},{verified:false});
});

router.get('/stories', async ctx => {
    var userId = ctx.query.user;
    var lastId = ctx.query.lastId;
    var options = {limit:5};
    var query = {private:false};
    if(lastId != 'false'){
        query._id = {$lt : lastId};
    }
    else{
        options.sort = {createdAt:-1};
    }
    var items = 'content date title user';
    
    if(userId != 'false'){
        if(userId == ctx.session.user){
            delete query.private;
            items = items + ' private';
        }
        query.user = userId;
    }else{
        var me = await mongo.user.findById(ctx.session.user,'following').lean();
        me.following.push(ctx.session.user);
        query.user = {$in:me.following};
    }
    ctx.body = await mongo.story.find(query, items, options)//.sort('-createdAt')
    .populate({ path: 'user',model:'user', select: 'name slug avatar'}).lean().exec();  
    
});


//ctx.body = await mongo.user.findByIdAndUpdate('5bb3692c184df071406b9bee',{ $addToSet: {following: [ '5bb368b9184df071406b9beb'] } });



router.get('/searchUser', async ctx => {
    var queryParam = ctx.query.name.toLowerCase();    
    var regExQuery = new RegExp('^' + queryParam, 'i');
    //name has to be searched in any case
    var query = [{'name': { $regex: regExQuery }} ];
    //if it doesn't contain a space then also search username 
    if(_.indexOf(ctx.query.name, ' ') < 0) query.push({ 'slug': { $regex: regExQuery } });
    ctx.body = await mongo.user.find({ $or:query },'-_id name avatar slug' ).limit(7).lean();
});

router.get('/zumba', async ctx => {
    ctx.body = await mongo.user.findByIdAndUpdate('5bb3692c184df071406b9bee',{avatar:'BK6a2t5Y4MoYfr4q9EeP.jpg'});
    
    /*
    var profile = await mongo.user.findById('5bb3692c184df071406b9bee','-_id name slug avatar bio stats following').lean();
    var stats = profile.stats;
    var following = profile.following;
    delete profile.stats,following;
    //delete profile.following;
    ctx.body = { profile , following, stats };

*/
    //ctx.body = await mongo.user.findByIdAndUpdate('5bb3692c184df071406b9bee',{ $pull: {following: '5bb368b9184df071406b9beb' } });
    //ctx.body = await mongo.user.findByIdAndUpdate('5bb09ff6856ecc214bc91677',{$unset: {following: 1 }});
    //user.set('following', undefined, {strict: false} );
    //ctx.body = await user.save();
    //ctx.body = await mongo.user.findByIdAndUpdate('5bb3692c184df071406b9bee',{ $addToSet: {following: [ '5bb368b9184df071406b9beb'] } });
    /*var res = await mongo.story.find({},'-id -updatedAt').
    sort('-createdAt').skip(1).limit(2).
    populate({ path: 'user',model:'user', select: 'name slug'}).lean().exec();
    for(var i in res){
        if(res[i].anonymous){
            delete res[i].user;
        }
    }
    ctx.body = res
    */
    //ctx.body = await mongo.user.findById(res.user,'name slug');
});


router.all('/logout', async ctx => {
    delete ctx.session.user;
    var longTermSessionToken = ctx.cookies.get(config.cookies.longTerm.name,[{signed:true}]);
    await mongo.verify.findByIdAndDelete(longTermSessionToken);
    ctx.cookies.set(config.cookies.longTerm.name,null);
    ctx.cookies.set(config.cookies.longTerm.name+'.sig',null);
    ctx.status = 204;
});


router.post('/signup', async ctx => {
    var userData = ctx.request.body.signupForm;
    try{
        var res = await new mongo.user(userData).save();
    }catch(error){
        if(error.code==11000) ctx.throw(400,'A user with the email already exists');
        else ctx.throw(400,'There was an error, Please try again');
    }
    var verify = await new mongo.verify({user:res._id}).save();
    var confirmLink = config.siteUrl+'confirm/'+verify.code;
    await mail({type:'signup',link:confirmLink,to:userData.email});
    ctx.status = 201;
    ctx.body = {message:"Your account has been created"};
});


router.all('/login', async ctx => {
    var userData = ctx.request.body.loginForm;
    var message = "We have no such user";
    var status = 422;
    var userProfile = null;
    //var userData = {accName:'reevkandari@gmail.com',pass:'awesome'};
    var typeOfaccName = (userData.accName.includes('@')) ? 'email' : 'slug';
    query={}
    query[typeOfaccName] = userData.accName;
    var user = await mongo.user.findOne(query,'_id pass verified').lean();
    if(user!=null){
        if(user.verified){
            if(bcrypt.compareSync(userData.pass, user.pass)){
                var device = UAParser(ctx.request.headers['user-agent']);
                var session = await new mongo.session({
                    user: user._id,
                    remoteAddr : ctx.request.headers['remote_addr'],
                    device : device.browser.name +" on " +device.os.name,
                }).save();
                ctx.cookies.set(
                    config.cookies.longTerm.name,
                    session._id,
                    config.cookies.longTerm);
                ctx.session.user = user._id;
                status=201;
                message="Login Successful"
            }else message="Incorrect Password";
        }else{
            status=200;
            message="Account not verified"
        }
    }
    ctx.status = status;
    ctx.body = {message:message};
});

router.all('/newConfirmRequest', async ctx => {
    var email=ctx.request.body.email;
    var message = "There is no Such user on our site";
    var status=200;
    var res = await mongo.user.findOne({email:email},'_id verified').lean();
    if(res){
        if(res.verified) message="The Account is already verified";
        else{
            var verify = await new mongo.verify({user:res._id}).save();
            var confirmLink = config.siteUrl+'confirm/'+verify.code;
            await mail({type:'signup',link:confirmLink,to:email});
            status = 201;
            message="We have sent you another verification mail";
        }
    }
    ctx.status = status;
    ctx.body = {message:message};
});

router.all('/verifyConfirmRequest', async ctx => {
    var code = ctx.request.body.code;
    var message="The link has either expired or is invalid";
    var status = 400;
    var verify = await mongo.verify.findOneAndDelete({code:code});
    if(verify){
        await mongo.user.findByIdAndUpdate(verify.user,{verified:true});
        status = 202;
        message="You account is now active";
    }
    ctx.status = status;
    ctx.body = {message:message};
});

router.all('/newForgotRequest', async ctx => {
    var email=ctx.request.body.email;
    var message = "There is no Such user on our site";
    var status=200;
    var res = await mongo.user.findOne({email:email},'_id').lean();
    if(res){
        var verify = await new mongo.verify({user:res._id}).save();
        var confirmLink = config.siteUrl+'forgot/'+verify.code;
        var x = await mail({type:'forgot',link:confirmLink,to:email});
        status = 201;
        message="We have sent you an email with a password reset link";
    }
    ctx.status = status;
    ctx.body = {message:message};
});


router.all('/verifyForgotRequest', async ctx => {
    var code = ctx.request.body.code;
    var message="The link has either expired or is invalid";
    var status = 400;
    var verify = await mongo.verify.findOneAndDelete({code:code}).lean();
    if(verify){
        ctx.session.god = {power:true,user:verify.user};
        status = 202;
        message = "Link verification successful. Please choose a new password";
    }
    ctx.status = status;
    ctx.body = {message:message};
});

router.all('/changePassword', async ctx => {
    var newPass = bcrypt.hashSync(ctx.request.body.newPass);
    var status = 401;
    var message = "You are not authorized for this action";
    if(ctx.session.god.power){
        var user = await mongo.user.findByIdAndUpdate(ctx.session.god.user,{pass:newPass}).lean();
        var status = 202;
        var message = "Password Changed Successfully";
    }
    delete ctx.session.god;
    ctx.status = status;
    ctx.body = {message:message};
});


router.get('/authStatus', async ctx => {
    ctx.status = (ctx.session.user) ? 202 : 401;
});


module.exports = router;
