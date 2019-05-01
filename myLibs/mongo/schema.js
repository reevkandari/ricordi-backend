var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const uid = require('uid-safe');

var user = Schema({
    name : {type:String , required:true, lowercase: true},
    email: {type:String , required:true, unique:true, lowercase: true},
    pass : {type:String , required:true},
    slug : {type:String, required:true, unique:true, lowercase: true},
    bio : {type:String},
    avatar: {type:String},
    following:[Schema.Types.ObjectId],
    stats:{
        followers: {type:Number, default:0},
        following: {type:Number, default:0},
        stories: {type:Number, default:0},
    },
    verified:{type:Boolean, default:false}
},{timestamps:true});

var story = Schema({
    user: {type:Schema.Types.ObjectId , required:true},
    title: {type:String, maxlength: 75 },
    content: {type:String, required:true, minlength: 10 },
    private : {type:Boolean, default:true},
    date : {type:Date},
},{timestamps:true});

var session = Schema({
    user: {type:Schema.Types.ObjectId , required:true},
    device:{type:String , required:true},
    remoteAddr:{type:String , required:true},
    lastCalled:{type:Date, default:Date.now},
},{timestamps:true});

var verify = Schema({
    user: {type:Schema.Types.ObjectId , required:true},
    code:{type:String , required:true, unique:true}
},{timestamps:true});

user.pre('validate', function(next) {
    //hasing the password
    this.pass = bcrypt.hashSync(this.pass);
    //produces a 15 character username; 
    this.slug = uid.sync(11);
    next();
});

verify.pre('validate',function(next){
    this.code = uid.sync(21);
    next();
});

  module.exports = {
      user,
      session,
      verify,
      story
  }