module.exports = {
    saltLevel: 7,
    siteName:'ricordi',
    siteUrl:'http://zivi.rivilabs.in/',
    siteQuote:'Be Wise, Be Dumb, but be yourSelf',
    mysql:{
        connectionLimit : 10,
        host            : 'localhost',
        user            : 'ricordi',
        password        : 'ricordi@rivilabs',
        database        : 'ricordi',
        multipleStatements: true
    },
    mail:{
        from:'Ricordi Admin<admin@rivilabs.com>',
        forgotSubject: 'Ricordi Password Reset',
        signupSubject: 'Ricordi Complete Registration',
        host: 'smtp.zoho.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'admin@rivilabs.com',
            pass: 'awesome678'
        }
    },
    cookies:{
        longTerm:{
            name:'kamli',
            httponly:true,
            signed:true,
            expires:new Date(Date.now() + 86400 * 1000 * 30)            
        },        
        session:{
            name:'sess',
            signed:true,
            httponly:true
        }
    }
}
