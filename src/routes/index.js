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

router.use("/login" , csrfMiddleware);
router.use("/register" , csrfMiddleware);
// router.use(csrfMiddleware);

router.all("*", (req, res, next) => {
    
    if(req.path == "/login" || req.path == "/register") {
        res.cookie("XSRF-TOKEN", req.csrfToken());
        next();
    }else {
        next();
    }
 
});

// middleware that checks if the user is logged in
function authChecker(req, res, next) {
    const sessionCookie = req.cookies.session || "";

    if(req.path == "/perfil" || 
       req.path == "/" || 
       req.path == "/exhibitor-page" ||
       req.path == "/admin"
       ) {
         if(sessionCookie == "") {
            res.redirect("/login");
         }
        next()
    }else {
        next()
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



router.get("/sessionLogout", (req, res) => {
    res.clearCookie("session");
    res.redirect("/login");
});

router.post("/updateContact", urlencodedParser ,(req, res) => {
    var data = req.body;

    db.collection("institution").doc(data.uid).update(data).then(() => {
        res.redirect("admin/"+data.uid);

        // res.end('{"message" : "Updated Successfully", "status" : 200}');
        // console.log("success");
    }).catch((err) => {
        res.end('{"message" : "Ocoreu uma falha" , "status" : 500}')
        console.log(err);
    })

})

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

            console.log(list);
            res.locals.title = "Seja bem vindo";   
            res.render('pages/index.html' , {
                list
            });

        })

});


async function countVisits(uidExhibitor, currentNumber) {
    var num =  parseInt(currentNumber);
    num++
    var data = { 
        visits: num
    }

    db.collection("institution").doc(uidExhibitor).update(data).then(()=> {
        console.log(uidExhibitor, num);
    })

}


async function countContact(uidExhibitor) {

    db.collection('institution').doc(uidExhibitor).get().then(function(doc) {
       var dataDoc = doc.data()

        var num = parseInt(dataDoc.countContact);
        num++;
        var data = {
            countContact: num
        }
        db.collection("institution").doc(uidExhibitor).update(data).then(() => {
            console.log(uidExhibitor);
        })

    });
  
}


router.get('/forgot-password', (req, res) => {
    res.locals.title = "Esqueceu palavra-passe";
    res.render('pages/forgot-password.html');
})


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
 
    var list = [];
    db.collection('buyers').get().then((querySnapshot) => {
        querySnapshot.forEach((buyersDoc) => {

            var data = buyersDoc.data()
            if(data.urlphoto == "") {

            }
            data["urlphoto"] = "https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/perfil%2Funnamed.jpg?alt=media&token=234789f8-f514-4ef0-aee4-36f534f03507";
          list.push(data);
        })
        
        res.locals.title = "Buyers";

        res.render('pages/buyers.html' , {
            list
        })
    })

})

router.get('/perfil' , (req , res) => {
    const sessionCookie = req.cookies.session || "";
    var data = [];
    var dataSchedule = [] ;

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .then((user) => {

            db.collection('users').doc(user.uid).get().then(function(doc) {
                data = doc.data()
                
            db.collection("users").doc(data.uid).collection("schedule").get()
                .then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        dataSchedule.push(doc.data())
                });

                res.locals.title = data.name;
                res.render('pages/perfil.html', {
                    data,dataSchedule
                });
            
            });

        });

    
        })
        .catch((error) => {
            console.log(error);
        //res.redirect("/register");
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
  
router.get("/register_buyer" , (req, res) => {

const sessionCookie = req.cookies.session || "";
var data = [];
var dataSchedule = [] ;

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {

        db.collection('users').doc(user.uid).get().then(function(doc) {
            data = doc.data()
            
            res.locals.title = data.name;
            res.render('pages/register-buyer.html', {
                data
            });           
        });

   
    })
    .catch((error) => {
        console.log(error);
      //res.redirect("/register");
    });

})

router.post("/register_buyer",urlencodedParser, (req, res) => {
   let data = req.body;
   data["uid"] = uuid();
  
   db.collection("buyers").doc(data.uid).set(data)
    .then(()=>{
        res.end('{"success" : "Updated Successfully", "status" : 200}');
        console.log("success");
    })
    .catch((error)=> {

    })
})


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
    var data = req.body;
    data["uid"] = scheduleUid;
    var link = await getLink();
    data["linkChat"] = link;
    const sessionCookie = req.cookies.session || "";

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true )
        .then((user) => {

            db.collection('users').doc(user.uid).get().then(function(doc) {
                var userData = doc.data()  
                data["userUid"] = userData.uid;
                data["name"] = userData.name;
                

                scheduleChat(data, res);
            });
    
    })
     .catch((error) => {
        res.redirect("/register");
    });
 
}

async function scheduleChat(data, res) {
    console.log(data);
    await db.collection('institution').doc(data.exhibitorUid).collection('schedule').doc( data.uid ).set(data)
        .then(function() {
            console.log("GooD")
            scheduleChatUsers(data, res);          
        })
        .catch(function(error) {   
            res.render('pages/schedule-chat?id='+data.exhibitorUid , {
                error
        })
    });

}

async function scheduleChatUsers(data, res) {

    await db.collection('institution').doc(data.exhibitorUid).get().then(function(doc) {
        var instData = doc.data();
        data["name"] = instData.name;
    })
    await db.collection('users').doc(data.userUid).collection('schedule').doc( data.uid ).set(data)
        .then(function() {
            res.end(JSON.stringify({ status: "success" }));             
        })
        .catch(function(error) {
            res.end(JSON.stringify({ status: "error" }));
        })


}


router.get('/schedule-chat' , (req , res) => {
countContact(req.query.id);
 const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {

        db.collection('users').doc(user.uid).get().then(function(doc) {
            var data = doc.data()
            res.locals.title = "Agendar";  
            res.render('pages/schedule-chat.html' , {
                data
            });
        });
   
    })
    .catch((error) => {
      res.redirect("/login");
    });

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

router.get("/openVideoChat" , urlencodedParser, (req, res) => {
    var uidExhibitor = req.query.uidExhibitor; 
    var uidSchedule = req.query.uidSchedule;
    var userUid = req.query.userUid;
    var link = req.query.link;
    console.log(userUid);
    openVideoChat(uidExhibitor ,uidSchedule,userUid,link, res);
 
})

// router.post('/openVideoChat' , urlencodedParser , (req ,res) => {
//     const sessionCookie = req.cookies.session || "";
//     openVideoChat( req.body.uidExhibitor, req.body.uidSchedule, req.body.link , res)
// })


async function  openVideoChat( uidExhibitor, uidSchedule, userUid, link , res) {
    var isHappened = {
        isHappened : true
    }

     await db.collection('users').doc( userUid ).collection('schedule').doc( uidSchedule ).update(isHappened)
     await db.collection('institution').doc( uidExhibitor ).collection('schedule').doc( uidSchedule ).update(isHappened)
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


// Create link

router.get("/link", async (req, res) => {
    var link = await getLink();
    console.log(link);
})
router.get("/createLink" ,(req, res) => {
    for(var i = 0; i < 10; i++) {
        setLinks("https://meet.google.com/nqo-vbju-uvu");
    }
})


async function getLink() {
  
    var link ;
   await db.collection("links").orderBy("uid", "desc")
    .limit(1)
    .get()
    .then(querySnapshot => {
        if (!querySnapshot.empty) {
            //We know there is one doc in the querySnapshot
            const queryDocumentSnapshot = querySnapshot.docs[0];
            link = queryDocumentSnapshot.data().link;
            queryDocumentSnapshot.ref.delete()
            return link;
        } else {
            console.log("No document corresponding to the query!");
            return null;
        }
    });
     
    return link;
}

function setLinks(link) {

    var data = {
        uid: uuid(),
        link: link
    }

    db.collection("links").doc(data.uid).set(data).then(() => {
        console.log("Success");
    }).catch((err) => {
        console.log(err);
    })

}


router.post("/login-exhibitor", (req, res) => {

    
})

router.get('/login-exhibitor' , (req , res) => {
    res.render('pages/login-exhibitor.html')
})


router.get("/add-video",  (req, res) => {
    res.render('pages/add-video.html');
})

router.post("/upload-video", upload.single('file') , async  (req, res) => {
    let file = path.join(__dirname , "../../uploads/"+req.file.filename);
    let destination = "exhibitor";
    console.log(req.file +" - "+ file);
    const url = await uploadVideo(path.normalize(file) , req.file.filename , destination, req.file);

    const uid = req.body.itemId;

    if(url != null && url != "") {

        var data = {
            videoUrl: url
        }


        db.collection('institution').doc( uid ).update(data).then(() => {
            res.redirect('/admin?id='+uid);
         }).catch((err) => {
          res.redirect('/add-video?id='+uid);
         })


    }
    

})

router.get("/upload-image",  (req, res) => {
    res.render("pages/upload-image.html");
})

router.post("/upload-image",upload.single('file') , async (req, res) => {
    let file = path.join(__dirname , "../../uploads/"+req.file.filename);
    let destination = "exhibitor";
    const url = await uploadPhoto(path.normalize(file) , req.file.filename , destination);
    
    const uid = req.body.itemId;
    const imgUid = uuid();
   
    const data = {
        url:url,
        uid:imgUid,
        time: ""
    }
    //todo show progress//

    if(url != null && url != "") {
        db.collection('institution').doc( uid ).collection('gallery').doc( imgUid ).set(data).then(() => {
            res.redirect('/exhibitor-gallery?id='+uid);
         }).catch((err) => {
          res.redirect('/upload-image?id='+uid);
         })
      
    } else {
        console.log("is empty");
        res.redirect('/upload-image?id='+uid);
    }
   

    
})

router.post("/updateDescription", urlencodedParser, (req, res) => {
    var description = req.body.description;
    var uid = req.body.uid;

    var data = {
        description: description
    }

    db.collection("institution").doc(uid).update(data).then(()=> {
        res.end(JSON.stringify({ status: 200, message : "Actualizado com sucesso" }));
    }).catch((err) => {
        res.end(JSON.stringify({ status: 501, message : "Actualizado com sucesso" }));
    })

})


router.get("/exhibitor-gallery", (req, res) => {
    var  dataGallery = [];

    db.collection("institution").doc(req.query.id).collection("gallery").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            dataGallery.push(doc.data())
        })
        console.log(dataGallery);
        res.render("pages/exhibitor-gallery", {
            dataGallery
        });
    })
   
})





async function uploadVideo(filepath , filename, destination, file) {
    var bucket = admin.storage().bucket();
    var token = uuid();
    const metadata = {
      metadata: {
        // This line is very important. It's to create a download token.
        firebaseStorageDownloadTokens: token
      },
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000',
    };

    var videoUrl = "";
    // Uploads a local file to the bucket
    await bucket.upload(filepath, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
      gzip: true,
      metadata: metadata,
      destination: destination+"/"+filename
    }).then((res)=>{

        var videoName = res[0].name.replace("/" , "%2F");
        videoUrl = "https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/"+videoName+"?alt=media&token="+token;
    
    }).catch((err)=>{
        return null;
    })
 
    return videoUrl;

}








async function uploadPhoto(filepath , filename, destination) {
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

    var imgUrl = "";
    // Uploads a local file to the bucket
    await bucket.upload(filepath, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
      gzip: true,
      metadata: metadata,
      destination: destination+"/"+filename
    }).then((res)=>{

        var imgName = res[0].name.replace("/" , "%2F");
        imgUrl = "https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/"+imgName+"?alt=media&token="+token;
    
    }).catch((err)=>{
        return null;
    })
 
    return imgUrl;

}



router.get('/admin' , (req ,res) => {

    if(req.query.id == null) {
        res.redirect('/login-exhibitor');
    } 

    var scheduleCount = 0;

    db.collection("institution").doc(req.query.id).collection("schedule").get()
    .then(querySnapshot => {
       scheduleCount = querySnapshot.size;
     });

    var data = null;
    db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
        data = doc.data()

        if(data == null || data == undefined) {
            res.redirect('/login-exhibitor');
        }

        data["scheduleCount"] = scheduleCount;

        console.log(data);

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
        if(data == null || data == undefined) {
            res.redirect('/404');
        }

         // count exhibitor visit 
         countVisits(req.query.id, data.visits);
        

        var dataGallery = [];
        console.log(dataGallery);
        db.collection("institution").doc(req.query.id).collection("gallery").get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                dataGallery.push(doc.data())
            })

            res.render('pages/exhibitor-page.html' , {
                data, dataGallery
            });

           
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
            res.redirect('/admin?id='+req.body.itemId);              
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
router.post('/register' , (req, res) => { 
    const sessionCookie = req.cookies.session || "";
    var data = req.body;

    admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {
        data["uid"] = user.uid;
        addUser(data ,res);
    })
    .catch((error) => {
        res.redirect("/register" , {
            error
        });
    });

});

// add user to the database //
async function addUser(data , res) {
    const newUser = await db.collection('users').doc(data.uid).set(data)
    .then(function() {
        // todo redirect to home
       res.redirect('/');            
    })
   .catch(function(error) {
    console.log("errpr")
       res.render('pages/register' , {
           error
       })
   });

}

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