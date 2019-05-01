const Koa = require('koa');
const shortTermSession = require('./myLibs/session/shortTerm');
const longTermSession = require('./myLibs/session/longTerm');
const bodyParser = require('koa-body');
const app = new Koa();  
app.keys=['speedforce'];

//This will handle all errors
app.use(async (ctx, next) => {
    try {
        await next();
     }catch  (err) {
      console.log(err);
      ctx.status = err.status || 400;
      err.message = err.message || "There was an Error with Your Request";
      ctx.body = err;
     }
});

//This will parse the data such as json and multipart binary
app.use(bodyParser({
  formidable:{uploadDir: '/home/rishabh/zivi.in/ricordi/uploads'},
  multipart: true,
  urlencoded: true
}));

//This will create like 15 minute sessions
app.use(shortTermSession);

//this will create a new 15 minute session if a long term session cookie is found
app.use(longTermSession);

//this calls the routing library
const router = require('@rd/routing');

//this calls the authentication routes
app.use(router.all.routes());

//this is the authentication middleware
app.use(async (ctx,next)=>{
  if(ctx.session.user) return next();
  else ctx.status=401;
});

//this calls the routes
app.use(router.user.routes());

//this starts the server
app.listen(3030);
