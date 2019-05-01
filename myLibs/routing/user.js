const Router = require('koa-router');
const router = new Router();
const mongo = require('@rd/mongo');
const config = require('@rd/config');
const uid = require('uid-safe');
const sharp = require('sharp');
var sanitizeHtml = require('sanitize-html');
const _ = require('lodash');
const bcrypt = require('bcryptjs');



router.post('/change_my_pass', async ctx => {
    var pass = ctx.request.body.pass;
    var res = await mongo.user.findById(ctx.session.user,'pass');
    if(!bcrypt.compareSync(pass.old, res.pass)) ctx.throw(409,'Incorrect Passsword');
    await mongo.user.findByIdAndUpdate(ctx.session.user,
        { pass : bcrypt.hashSync(pass.new)});
    ctx.status=202;
});

router.post('/log_out_this_device', async ctx => {
    await mongo.session.findByIdAndDelete( {user:ctx.session.user} );
    ctx.status = 204;
});

router.post('/log_out_all_devices', async ctx => {
    var query = {_id:ctx.request.body.session_id,user:ctx.session.user};
    var res = await mongo.story.findOneAndDelete(query);
    ctx.status = (res) ? 204 : 401;
});

router.get('/active_sessions', async ctx => {
    ctx.body  = await mongo.session.find({user:ctx.session.user},{} ,{ sort: { createdAt : -1 }});
});

router.get('/me/:items', async ctx => {
    ctx.body  = await mongo.user.findById(ctx.session.user, ctx.params.items).lean();
});

router.put('/deleteStory', async ctx => {
    var storyId = ctx.request.body.storyId;
    var query = {_id:storyId,user:ctx.session.user};
    await mongo.story.findOneAndDelete(query);
    await mongo.user.findByIdAndUpdate(ctx.session.user,{ $inc: { 'stats.stories': -1 }});
    ctx.stats = 202;
});


router.put('/editStory', async ctx => {
    console.log('Editing story');
    var storyId = ctx.request.body.storyId;
    var editedStory = ctx.request.body.editedStory;
    editedStory.content = await sanitizeHtml(editedStory.content, { allowedTags: [] });
    var query = {_id:storyId,user:ctx.session.user};
    ctx.body  = await mongo.story.findOneAndUpdate(query,editedStory);
});

router.all('/unfollow', async ctx => {
    var theirId = ctx.request.body.theirId;
    var user = await mongo.user.findById(ctx.session.user,'following').lean();
    var followingList = _.map(user.following, function(item){return String(item)});
    var exist = _.includes(followingList, theirId );
    if(exist){
        await mongo.user.findByIdAndUpdate(ctx.session.user,{
            $pull: {following: theirId },
            $inc: { "stats.following" : -1} 
        });
        await mongo.user.findByIdAndUpdate(theirId,{
            $inc: { "stats.followers" : -1} 
        });
    } 
    ctx.status = 204;
});

router.all('/follow', async ctx => {
    var theirId = ctx.request.body.theirId;
    var user = await mongo.user.findById(ctx.session.user,'following').lean();
    var followingList = _.map(user.following, function(item){return String(item)});
    var exist = _.includes(followingList, theirId );
    if(!exist){
        await mongo.user.findByIdAndUpdate(ctx.session.user,{
            $addToSet: {following: theirId },
            $inc: { "stats.following" : 1} 
        });
        await mongo.user.findByIdAndUpdate(theirId,{
            $inc: { "stats.followers" : 1} 
        });
    } 
    ctx.status = 204;
});




router.all('/theirProfile/:slug', async ctx => {
    var profile = await mongo.user.findOne({slug:ctx.params.slug},'_id name slug avatar bio stats').lean();
    if(profile == null) ctx.throw(404,'No Such User');
    var stats = profile.stats;
    var profile = _.omit(profile, [stats]);
    ctx.body = {profile, stats}
});

router.all('/updateProfile', async ctx => {
    var profile = _.pick(ctx.request.body.newProfile, ['avatar','bio','slug','name'])
    profile.bio = await sanitizeHtml(profile.bio, { allowedTags: [] });    
    if(ctx.session.avatar && profile.avatar.includes(':')){
        profile.avatar = uid.sync(15) + '.jpg';
        await sharp(ctx.session.avatar).
        resize(200,200).toFile('/home/rishabh/zivi.in/media/'+profile.avatar);
    }
    try{
        var user = await mongo.user.findByIdAndUpdate(ctx.session.user,profile).lean();
    }catch(error){
        if(error.code==11000) ctx.throw(409,'Sorry, But the username is already taken');
        else ctx.throw(400,'There was an error, Please try again');        
    }
    delete ctx.session.avatar;
    ctx.body = {profile};
});

router.all('/uploadAvatar', async ctx => {
    //var fs = require('fs');
    ctx.session.avatar = ctx.request.files.avatar.path;
    ctx.body = 'done';
    /*fs.createReadStream()
    .pipe(fs.createWriteStream(ctx.request.files.avatar.name));*/ 
    //console.log(ctx.request.files.avatar);
});

router.all('/newStory', async ctx => {
    var newStory = ctx.request.body.newStory;
    newStory.content = await sanitizeHtml(newStory.content, { allowedTags: [] });
    newStory.title = await sanitizeHtml(newStory.title, { allowedTags: [] });
    newStory.user = ctx.session.user; 
    var story = await new mongo.story(newStory).save();
    await mongo.user.findByIdAndUpdate(ctx.session.user,{ $inc: { 'stats.stories': 1 }});
    ctx.status = 201;
});


/*
router.get('/myProfile', async ctx => {
    var user = await mongo.user.findById(ctx.session.user,'-_id name slug avatar bio stats following').lean();
    var stats = user.stats;
    var following = user.following || Array();
    var profile = _.omit(user, ['stats','following']);
    ctx.body = { profile , following, stats };
});
*/

module.exports = router;
