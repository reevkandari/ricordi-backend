const fs = require('fs');
const path = require('path');
const mailBodyStructure = fs.readFileSync(path.resolve(__dirname, 'structure.html'), 'utf8');
const config = require('@rd/config');

module.exports = async function(opts){
    var templateHero = fs.readFileSync(path.resolve(__dirname, opts.type +'.html'), 'utf8');
    var theDict = {
        templateHero:templateHero,
        siteQuote: config.siteQuote,
        siteName: config.siteName,
        adminEmail: config.mail.auth.user,
    };
    for(var key in opts) theDict[key] = opts[key];
    var mailBody = mailBodyStructure;
    for(var key in theDict){
        mailBody = mailBody.replace(new RegExp('{{'+key+'}}','g'), theDict[key]);
    }
    return mailBody;
    //sitequote sitename adminemail
}
