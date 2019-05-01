const mongoose = require('mongoose');
const schema = require('./schema');
mongoose.set('useFindAndModify', false);

mongoose.connect('mongodb://localhost/ricordi',
{useNewUrlParser:true,  useCreateIndex: true} );

const user = mongoose.model('user', schema.user,'user');
const session = mongoose.model('session', schema.session,'session');
const verify = mongoose.model('verify', schema.verify,'verify');
const story = mongoose.model('story', schema.story,'story');

module.exports = {
    user,
    session,
    verify,
    story
}