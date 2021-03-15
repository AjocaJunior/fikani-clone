const bodyParser = require('body-parser');
const {check , validationResult} = require('express-validator');
const { Router} = require('express');
const router = Router();
const firebase = require("firebase/app");
const admin = require("firebase-admin");
require("firebase/auth");
require("firebase/storage")
require("firebase/firestore");
//const googleStorage = require('@google-cloud/storage');
const {Storage} = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const { uuid } = require('uuidv4');
const formidable = require('formidable');
const urlencodedParser = bodyParser.urlencoded({extended:false})
var serviceAccount = require('../../fikani-firebase-adminsdk-nhqwx-30a29e774a.json');
const { render } = require('ejs');
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const express = require("express");


const csrfMiddleware = csrf({ cookie: true });

router.use(bodyParser.json());
router.use(cookieParser());
router.use(csrfMiddleware);

router.all("*", (req, res, next) => {
    res.cookie("XSRF-TOKEN", req.csrfToken());
    next();
});

// middleware that checks if the user is logged in
function authChecker(req, res, next) {
    const sessionCookie = req.cookies.session || "";
      if(sessionCookie == "") {

        if(req.path == "/register-exhibitor" ||
           req.path == "/login-exhibitor" || 
           req.path == "/admin" || 
           req.path == "/tables-schedule"
        ) {
            next();
         } else {
            res.redirect("/register");
        }
       
    } else {
        next();
    }
}

router.use(authChecker)

// Initialize Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://fikani.appspot.com"
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

// storage
const storage  = new Storage({
    projectId: "fikani",
    keyFilename: serviceAccount 
  });

const bucket = storage.bucket("fikani.appspot.com");


// Multer config
const storageMulter = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()+'-'+file.originalname);
    }
});
  
const upload = multer({ storage: storageMulter });


router.get('/confer' , (req , res)=> {
    res.locals.title = "Conferencia";
    res.render('pages/confer');
});

router.get('/confer-live' , (req , res)=> {
    res.locals.title = "live";
    res.render('pages/confer-live');
});

router.get('/' , (req , res)=> {
    var instReference = db.collection("institution");
    var list = [];
    var count = 0;

    //todo count
        instReference.get().then((querySnapshot) => {
            querySnapshot.forEach((instDoc) => {
                var instDocData = instDoc.data()
                count++;
                if(instDocData.imgUrl == null || instDocData.imgUrl == '' ) {
                    instDocData.imgUrl = 'https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/perfil%2Funnamed.jpg?alt=media&token=234789f8-f514-4ef0-aee4-36f534f03507';
                }
                // todo random 
                if(count == 6) {
                   return
                }
                list.push( instDocData);  
            })         

            res.locals.title = "Seja bem vindo";   
            res.render('pages/index.html' , {
                list
            });

        })

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

router.get('/buyers', (req, res) => {
    res.locals.title = "Buyers";
    res.render('pages/buyers.html')
})

router.get('/perfil' , (req , res) => {
const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {
      console.log(user.uid);
      res.locals.title = "Perfil";
      res.render("pages/perfil.html");
    })
    .catch((error) => {
      res.redirect("/register");
    });

})

router.get('/about' , (req , res) => {
    res.render('pages/about.html');
})

router.get('/register' , (req , res)=> {
    res.render('pages/register');
});

router.get('/gallery', (req , res) => {
    res.locals.title = "Galeria";
    res.render('pages/gallery.html');
})


router.post("/sessionLogin", (req, res) => {
    const idToken = req.body.idToken.toString();
  
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
    admin
      .auth()
      .createSessionCookie(idToken, { expiresIn })
      .then(
        (sessionCookie) => {
          const options = { maxAge: expiresIn, httpOnly: true };
          res.cookie("session", sessionCookie, options);
          res.end(JSON.stringify({ status: "success" }));
        },
        (error) => {
          res.status(401).send("UNAUTHORIZED REQUEST!");
        }
      );
  });
  


router.get('/exhibitor' , (req , res) => {
  
    var instReference = db.collection("institution");
            //Get them
        var list = [];
        instReference.get().then((querySnapshot) => {
            //querySnapshot is "iteratable" itself
            querySnapshot.forEach((instDoc) => {
                var instDocData = instDoc.data()
                if(instDocData.imgUrl == null || instDocData.imgUrl == '' ) {
                    console.log(instDocData.imgUrl);
                    instDocData.imgUrl = 'https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/perfil%2Funnamed.jpg?alt=media&token=234789f8-f514-4ef0-aee4-36f534f03507';
                }
                list.push( instDocData);
    
            })         

            res.render('pages/exhibitor.html' , {
                list
            });

        })

}); 


router.post('/schedule-chat', urlencodedParser , (req , res) => {
    addSchedule(req , res);
})


async function addSchedule(req , res) {
    var scheduleUid = uuid();

    //todo get user name//
    //todo get link
    var data = {
        uid : scheduleUid,
        day : req.body.day,
        time : req.body.time,
        email : req.body.email,
        isHappened : false,
        linkChat: "https://meet.google.com/zpd-jprv-vre",
        name : "Agostinho Dos Santos"
    }

    const newSchedule = await db.collection('institution').doc(req.body.itemId).collection('schedule').doc( scheduleUid ).set(data)
        .then(function() {
            res.redirect('exhibitor-page?id='+req.body.itemId);               
        })
        .catch(function(error) {   
            res.render('pages/schedule-chat?id='+req.body.itemId , {
                error
        })
    });

}


router.get('/schedule-chat' , (req , res) => {
    res.render('pages/schedule-chat.html');
})

router.get('/schedule' , (req ,res) => {
    res.render('pages/schedule.html');
})

router.get('/webinar', (req , res) => {
    res.render('pages/webinar.html');
})


router.get('/tables-schedule', (req , res) => {

    if(req.query.id == null) {
        res.redirect('/login-exhibitor');
    } 

    var data = [];
    var dataSchedule = [] ;

    console.log(dataSchedule.length);

    db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
        data = doc.data()
    });

    db.collection("institution").doc(req.query.id).collection("schedule").get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                dataSchedule.push(doc.data())
        });

        res.render('pages/tables-schedule.html', {
              data,dataSchedule
        });
      
    });

})


router.post('/openVideoChat' , urlencodedParser , (req ,res) => {
    openVideoChat( req.body.uidExhibitor, req.body.uidSchedule, req.body.link , res)
})


async function  openVideoChat( uidExhibitor, uidSchedule, link , res) {
    var isHappened = {
        isHappened : true
    }

    const updateSchedule = await db.collection('institution').doc( uidExhibitor ).collection('schedule').doc( uidSchedule ).update(isHappened)
    .then(function() {
        if(link != null && link != "") {
            res.redirect(link);       
        } else {
            res.redirect("/404");   
        }
               
    })
    .catch(function(error) {   

        if(link != null && link != "") {
            res.redirect(link);       
        } else {
            res.redirect("/404");   
        }

    });


}


router.get('/login-exhibitor' , (req , res) => {
    res.render('pages/login-exhibitor.html')
})

router.get('/admin' , (req ,res) => {

    if(req.query.id == null) {
        res.redirect('/login-exhibitor');
    } 
    var data = null;
    db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
        data = doc.data()

        res.render('pages/admin.html' , {
            data
        });

    });
 

})


router.get('/exhibitor-page' , (req, res) => {

    if(req.query.id == null) {
        res.redirect('/404');
    } 
    var data = null;
    db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
        data = doc.data()

        res.render('pages/exhibitor-page.html' , {
            data
        });

    });
 
   
});

router.get('/404' , (req , res) => {
    res.render('pages/404.html');
})

router.get('/register-exhibitor-second' , (req , res) => {
    console.log( req.query.id);

    res.render('pages/register-exhibitor-secondpage.html');
});

router.post('/register-exhibitor-second', upload.single('file') , (req , res) => {
     let file = path.join(__dirname , "../../uploads/"+req.file.filename);
     uploadFile(path.normalize(file) , req.file.filename , req, res ).catch(console.error);
})


// upload file
async function uploadFile(filepath , filename , req, res ) {
    var bucket = admin.storage().bucket();
    var token = uuid();
    const metadata = {
      metadata: {
        // This line is very important. It's to create a download token.
        firebaseStorageDownloadTokens: token
      },
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    };
  
    // Uploads a local file to the bucket
    await bucket.upload(filepath, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
      gzip: true,
      metadata: metadata,
    });
  

  var imgUrl = "https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/"+filename+"?alt=media&token="+token;
  var instData = {
    description: req.body.description,
    imgUrl: imgUrl 
  }

  const newInstitution = await db.collection('institution').doc(req.body.itemId).update(instData)
         .then(function() {
             // todo redirect to dashboard //

            res.redirect('/');               
        })
        .catch(function(error) {
            //reload page and show error
        
            res.render('pages/register-exhibitor-secondp?id='+req.body.itemId , {
                error
        })
     });

  }



router.post('/register-exhibitor' , urlencodedParser , [
    check('name' , 'Nome invalido')
        .exists()
        .isString(),
    check('location' , 'Localizacao invalida' )
        .exists()
        .isLength({min: 4}),
    check('contact' , 'Contacto invalido')
        .exists()
        .isLength({min:8}),
    check('email' , 'email invalido')
        .isEmail()
        .normalizeEmail(),
    check('password' , "Password invalido")
        .exists(),
    check('verfication_code' , "Codigo de verificação errada")
        .trim()
        .equals('2020a')
    
], (req , res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const alert = errors.array();
        res.render('pages/register-exhibitor', {
            alert
        })
    } else {
        registerExhibitor(req.body, res);
    }
})

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


function registerExhibitor(body , res) {

   var institution = {
       name : body.name,
       location: body.location,
       contact: body.contact,
       website: body.website,
       category: body.category,
       imgUrl: '',
       videoUrl: '',
       description: '',
       email : body.email,
       password : body.password,
       visits: 33,
       countContact: 120
   }


    admin
    .auth()
    .createUser(institution)
    .then((data) => {
        institution['uid'] =  data.uid;
        console.log(data.uid)
        delete institution.password;
        createInstitution(institution , res );
    })
    .catch((error) => {
  
      res.render('pages/register-exhibitor' , {
          error
      })
  
    });


}
 
// add institution in database
async function  createInstitution(institution , res ) {

    const newInstitution = await db.collection('institution').doc(institution.uid).set(institution)
         .then(function() {
             // redirect to homepage //
            res.redirect('/register-exhibitor-second?id='+institution.uid);               
        })
        .catch(function(error) {
            //reload page and show error
            res.render('pages/register-exhibitor' , {
                error
        })
     });
}


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
    delete user.password; // delete password in user class
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