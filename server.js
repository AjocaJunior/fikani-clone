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

app.post('/login' , (req , res)=> {
    
})

// register post
app.post('/register' , urlencodedParser, [
    check('name', 'O nome deve ter 3 letras no minimo')
        .exists()
        .isLength({min: 3}),
    check('email', 'Email invalido')
        .isEmail()
        .normalizeEmail(),
    check('password', 'O nome deve ter 4 letras no minimo')
        .exists()
        .isLength({min:4}),
    check('contact' , 'Contacto invalido')
        .exists()
        .isMobilePhone()
] ,(req , res)=> {
    
    const errors = validationResult(req)
    if(!errors.isEmpty()){
         
        const alert = errors.array();
              
        res.render('pages/register' , {
            alert
        })

    }else {
        // todo set

        res.render('pages/index');
    }

});


app.listen(3000);
console.log('3000 is the magic port');