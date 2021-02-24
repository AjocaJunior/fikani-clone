const bodyParser = require('body-parser');
const {check , validationResult} = require('express-validator');
const admin = require("firebase-admin");
const { Router} = require('express');
const router = Router();


const urlencodedParser = bodyParser.urlencoded({extended:false})


//firebase auth
var serviceAccount = require('../../fikani-firebase-adminsdk-nhqwx-30a29e774a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// index page
router.get('/' , (req , res)=> {
    res.render('pages/index');
});

// login page
router.get('/login' , (req ,res)=> {
    res.render('pages/login');
});

// register page
router.get('/register' , (req , res)=> {
    res.render('pages/register');
});

router.post('/login' , (req , res)=> {
    
})

// register post
router.post('/register' , urlencodedParser, [
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
        register()
        res.render('pages/index');
        


    }

});


function register() {

    admin
  .auth()
  .createUser({
    email: 'user@example.com',
    emailVerified: false,
    phoneNumber: '+11234567890',
    password: 'secretPassword',
    displayName: 'John Doe',
    photoURL: 'http://www.example.com/12345678/photo.png',
    disabled: false,
  })
  .then((userRecord) => {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log('Successfully created new user:', userRecord.uid);
  })
  .catch((error) => {
    console.log('Error creating new user:', error);
  });

}

module.exports = router;