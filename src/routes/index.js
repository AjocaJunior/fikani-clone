const bodyParser = require('body-parser');
const {check , validationResult} = require('express-validator');
const { Router} = require('express');
const session = require('express-session');
const router = Router();
const firebase = require("firebase/app");
const admin = require("firebase-admin");
require("firebase/auth");
require("firebase/firestore");


const urlencodedParser = bodyParser.urlencoded({extended:false})
var serviceAccount = require('../../fikani-firebase-adminsdk-nhqwx-30a29e774a.json');
const { render } = require('ejs');

// Initialize Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var firebaseConfig = {
    apiKey: "AIzaSyBEJWJCm8OnSYYu2-VYqeRi03JprBcaUkg",
    authDomain: "fikani.firebaseapp.com",
    projectId: "fikani",
    storageBucket: "fikani.appspot.com",
    messagingSenderId: "146961453473",
    appId: "1:146961453473:web:7fec98e5503384f08c7be0"
};
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = admin.firestore();

router.get('/confer' , (req , res)=> {
    res.locals.title = "Conferencia";
    res.render('pages/confer');
});

router.get('/confer-live' , (req , res)=> {
    res.locals.title = "live";
    res.render('pages/confer-live');
});

router.get('/' , (req , res)=> {
    res.locals.title = "Seja bem vindo";    
    res.render('pages/index');
});



router.get('/info' , (req , res) => {
    res.locals.title = "Informações";
    res.render('pages/info')
})

router.get('/contact' , (req , res) => {
    res.locals.title = "Contacto";
    res.render('pages/contact.html');
})

router.get('/register-exhibitor' , (req , res) => {
    res.locals.tittle = "Register Expositor";
    res.render('pages/register-exhibitor.html');
});

router.get('/schedule' , (req , res) => {
    res.locals.title = "Agenda";
    res.render('pages/schedule.html');
})

router.get('/login' , (req , res)=> {
    res.locals.title = "Seja bem vindo";
    res.render('pages/login');
});

router.get('/register' , (req , res)=> {
    res.render('pages/register');
});

router.get('/exhibitor' , (req , res) => {
    res.render('pages/exhibitor.html');
});

router.get('/exhibitor-page' , (req, res) => {
    res.render('pages/exhibitor-page.html');
});

router.get('/contact' , (req , res) => {
    res.render('/contact.html');
});



router.post('/login' , urlencodedParser, [
    check('email' , "Email invalido")
        .isEmail()
        .normalizeEmail(),
    check('password' , "Password invalido")
        .exists()
        .isLength({min:4})
        
] ,(req , res)=> {
   const errors = validationResult(req)
   if(!errors.isEmpty()) {
    const alert = errors.array();
              
    res.render('pages/login' , {
        alert
    })
   } else {

    firebase.auth().signInWithEmailAndPassword(req.body.email.trim() , req.body.password.trim())
    .then((user) => {
        console.log(user.uid);
        res.redirect('/'); 
    })
    .catch((error) => {
    //   var errorCode = error.code;
    //   var errorMessage = error.message;
    //   console.log(errorMessage)

      res.render('pages/login' , {
          error
      })
    });


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

      register(req.body.name , req.body.last_name, req.body.residence,req.body.email.trim() , req.body.contact , req.body.password.trim() , displayName, urlphoto, res ) 

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


    firebase.auth.signInWithEmailAndPassword(email , password) 

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