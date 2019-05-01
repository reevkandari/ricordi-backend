var nodemailer = require('nodemailer');
const config = require('@rd/config');
const template = require('./templates');

// Create the transporter with the required configuration for Gmail
// change the user and pass !
var transporter = nodemailer.createTransport(config.mail);

// send mail with defined transport object
module.exports = async function (opts){
    var mailSubject = eval('config.mail.'+opts.type+'Subject');
    var mailBody = await template({type:opts.type,accessLink:opts.link,subject:mailSubject});
    return await transporter.sendMail({
        //from: config.mail.auth.user,
        from: config.mail.from, // sender address (who sends)
        to: opts.to,
        subject: mailSubject,
        html : mailBody,
    });
}
