var Redis = require('ioredis');
var redis = new Redis();
var pipeline = redis.pipeline();
var uid = require('uid-safe');
const config = require('@rd/config');

var opts = {
    age:3600, //3600 seconds = 1 hour
    session:config.cookies.session
}

module.exports = async function(ctx,next){
    //initialise the session variable to prevent undefined behaviour
    var session = false;
    //fetch the secure session token
    sessionToken = ctx.cookies.get(opts.session.name,[{signed:true}]);
    //if token exist, read the session.
    if(sessionToken != null) session = await read();
    //if session doesn't exist with the mentioned token, create a new session
    if(!session){
        var session = await create(opts);
        ctx.cookies.set(opts.session.name, sessionToken, opts.session);
        //ctx.cookies.set(opts.csrf.name,session.csrf,opts.csrf);
    }
    //save the new/old session data in the ctx object.
    ctx.session = session;
    //await all other chained middleware to execute, this allows modifying the session.
    await next();
    
    //setting the header that tells whether the user is still authenticated
    var authStatus = (ctx.session.user) ? 'pass' : 'fail'; 
    ctx.set('auth',authStatus);

    //after all changes have been made to the session, stringify and save it and extend it.
    var sessionDataString = JSON.stringify(ctx.session);
    return await redis.set(sessionToken, sessionDataString, 'ex', opts.age);
}

async function read(){
    //read the session
    var sessionData = await redis.get(sessionToken);
    //if session exists parse and return the data  in json 
    if(sessionData != null) return JSON.parse(sessionData);
    else return false;
}

async function create(){
    /* let sessionToken be global so it can be used 
    for creating cookie in the middleware function */
    sessionToken = uid.sync(21);
    //csrf token created on every new session
    //var csrfToken = uid.sync(15);
    //sessionData now contains the csrf token
    var sessionData = {};
    await redis.set(sessionToken,JSON.stringify(sessionData),'ex',opts.age);
    return sessionData;
}