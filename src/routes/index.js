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

const db = admin.firestore();


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

router.post('/login' , urlencodedParser, [
    check('email' , "Email invalido")
        .isEmail()
        .normalizeEmail(),
    check('password' , "Password invalido")
        .isString()
] ,(req , res)=> {
   const errors = validationResult(req)
   if(!errors.isEmpty()) {
    const alert = errors.array();
              
    res.render('pages/login' , {
        alert
    })
   } else {
       console.log(req.body)
   }
})

// register post
router.post('/register' , urlencodedParser, [
    check('name', 'O nome deve ter 3 letras no minimo')
        .exists()
        .isLength({min: 3}),
    check('email', 'Email invalido')
        .isEmail()
        .normalizeEmail(),
    check('password', 'O password deve ter 6 letras no minimo')
        .exists()
        .isLength({min:6}),

    check('password' , "O password deve ter letras")
        .isString(),
    check('contact' , 'Contacto invalido')
        .exists()
        .isLength({min:5})
] ,(req , res)=> {
    
    const errors = validationResult(req)
    if(!errors.isEmpty()){
         
        const alert = errors.array();
              
        res.render('pages/register' , {
            alert
        })

    }else {

      var  displayName = req.body.name +" "+req.body.last_name;
      var  urlphoto = "https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/perfil%2Funnamed.jpg?alt=media&token=234789f8-f514-4ef0-aee4-36f534f03507"; //default perfil img

      register(req.body.name , req.body.last_name, req.body.residence,req.body.email , req.body.contact , req.body.password , displayName, urlphoto, res ) 

    }

});


function register(name , last_name, localization,email , phoneNumber , password ,displayName,photoURL ,res ) {

    var user = {
        name: name ,  
        last_name: last_name,
        localization: localization,
        email: email,
        emailVerified: false,
        password: password,
        displayName: displayName,
        photoURL: photoURL,
        disabled: false
    };

  admin
  .auth()
  .createUser(user)
  .then((userRecord) => {
      
    user['uid'] =  userRecord.uid; // add user uid //
    user['phoneNumber'] = phoneNumber; // add user phone//

    registerUser(user , res)
  })
  .catch((error) => {

    res.render('pages/register' , {
        error
    })

  });

}


async function registerUser(user , res) {
    delete user.password;
    const newUser = await db.collection('users').doc(user.uid).set(user)
         .then(function() {
             // redirect to homepage //
            res.redirect('/');               
        })
        .catch(function(error) {
            //reload page and show error
            res.render('pages/register' , {
                error
            })
        });

}

module.exports = router;