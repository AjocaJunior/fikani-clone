const express = require('express');
const app = express();
const port =  3000 || process.env.PORT;
const bodyParser = require('body-parser');
const {check , validationResult} = require('express-validator');



// set static folder
app.use(express.static(__dirname + '/public'));

// set the view engine to ejs
app.set('view engine', 'html');
app.engine('html',require('ejs').renderFile);

const urlencodedParser = bodyParser.urlencoded({extended:false})

// index page
app.get('/' , (req , res)=> {
    res.render('pages/index');
});

// login page
app.get('/login' , (req ,res)=> {
    res.render('pages/login');
});

// register page
app.get('/register' , (req , res)=> {
    res.render('pages/register');
});

// register post
app.post('/register' , urlencodedParser, [
    check('name', 'This username must be 3+ characters long')
        .exists()
        .isLength({min: 3}),
    check('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail()
] ,(req , res)=> {
    
    const errors = validationResult(req)
    if(!errors.isEmpty()){
          // return res.status(422).jsonp(errors.array())

          const alert = errors.array();

        

    }

});


app.listen(3000);
console.log('3000 is the magic port');