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
app.post('/register' , urlencodedParser ,(req , res)=> {
    
});




app.listen(3000);
console.log('3000 is the magic port');