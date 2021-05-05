const bodyParser = require('body-parser');
const providers = require("../utils/providers")
const utils = require("../utils/utils")
const {db, bucket,admin} = require("../utils/databaseConfing")
const {check , validationResult} = require('express-validator');
const { Router} = require('express');
const router = Router();


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
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const fs = require('fs');
require('dotenv').config()


const csrfMiddleware = csrf({ cookie: true });

router.use(bodyParser.json());
router.use(cookieParser());
router.use("/login" , csrfMiddleware);
router.use("/register" , csrfMiddleware);
// router.use(csrfMiddleware);

providers.getTotalValue()

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

// Email config
let transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user:  process.env.EMAIL,
        pass:  process.env.PASSWORD
    }
}));



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


router.post("/removeVideo", urlencodedParser , async(req, res) => {
    var data = { videoUrl: ""}
    var uid = req.body.uid;
    var status = await providers.removeVideo(uid, data);

    if(status) {
        res.status(200).send("Deletado com sucesso!");
    } else {
        res.status(500).send("Ocoreu uma falha!!!");
    }
   
})


router.get("/sessionLogout", (req, res) => {
    res.clearCookie("session");
    res.redirect("/login");
});

router.post("/updateContact", urlencodedParser ,async (req, res) => {
    var data = req.body;
    var status = await providers.removeVideo(data);
   
    if(status) {
        res.redirect("admin/"+data.uid);
    } else {
        res.status(500).send("Ocoreu uma falha")
    }

})

router.get('/confer' , async(req , res)=> {
    var adsList = await providers.getAdsList()
    var position =[ Math.floor(Math.random() * adsList.length) + 0,  Math.floor(Math.random() * adsList.length) + 0]
               
    res.locals.title = "Conferencia";
    res.render('pages/confer',{adsList, position});
});

router.get('/confer-live' , async(req , res)=> {
    res.locals.title = "live";

    var liveData = await providers.getLive
    res.render('pages/confer-live', {liveData});  
});


router.post("/sendEmail", urlencodedParser ,(req, res) => {
    var email = req.body.email;
    var name = req.body.name;
    var message = req.body.message + " enviado por "+ name + " email: "+email;
    var subject = "Formulario de contacto fikani"
    sendEmail(message, email, subject);
    res.redirect("/contact");
})


function sendEmail(message, user_email, subject) {

    var mailOptions = {
        from: user_email,
        to: process.env.EMAIL,
        subject: subject,
        text: message
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
         
          console.log('Email sent: ' + info.response);
        }
      });

}

// home page
router.get('/' , async(req , res)=> {
    res.locals.title = "Seja bem vindo"; 
    var exhitorList = await providers.getExhibitors()
    var list = []
    if(exhitorList.length > 8) {
        list = exhitorList.slice(0, 8);
    }else {
        list = exhitorList
    }
    
    var listGallery = await providers.getGallery()
    var liveData = await providers.getLive()
             
    res.render('pages/index.html' , {
        list, liveData, listGallery
    });

});


router.get('/forgot-password', (req, res) => {
    res.locals.title = "Esqueceu palavra-passe";
    res.render('pages/forgot-password.html');
})


router.get('/info' , async(req , res) => {
    var listInfo = await providers.getPublication();

    res.locals.title = "Informações";
    res.render('pages/info', { listInfo })
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

router.get('/buyers', async(req, res) => {
    var list = await providers.getBuyers()
    res.locals.title = "Buyers";
    res.render('pages/buyers.html' , {list})  
})

router.get('/perfil' , async(req , res) => {
    const sessionCookie = req.cookies.session || "";
   
    admin
        .auth()
        .verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .then(async(user) => {

            var data = await providers.getUserById(user.uid);
            var dataSchedule = await providers.getUserSchedule(user.uid)

            res.locals.title = data.name;
            res.render('pages/perfil.html', {
                data,dataSchedule
            });
    
        })
        .catch((error) => {
            console.log(error);
        res.redirect("/register");
        });

})

router.get("/news", async(req, res) => {
    var uid = req.query.id
    var data = await providers.getPublicationById(uid)

    res.render("pages/news-full", {data})
})

router.post("/add-info", upload.single('file'), async(req, res) => {

    let file = path.join(__dirname , "../../uploads/"+req.file.filename);
    let destination = "publication";
    let uid = uuid();
    let title = req.body.title;
    let author = req.body.author;
    let description = req.body.description;
    let date = (new Date()).toISOString().split('T')[0];
    let url = await uploadPhoto(path.normalize(file) , req.file.filename , destination);

    var data = {
        urlphoto: url,
        uid: uid,
        title: title,
        author: author,
        date: date,
        description: description
    }

    console.log(data)
    var status =  await  providers.setPublication(data);
    if(status) {
        res.redirect("/admin-main")        
    } else {
        res.status(500).send("Error")
    }
})

router.get("/add-info", (req, res) => {
    res.render('pages/add-info')
})

router.get("/admin-main", async(req, res) => {
    var liveData = await providers.getLive();
    var totalData = await providers.getTotalValue();
    console.log(totalData)
    // var liveData = query.data()
    res.render('pages/admin-main', {liveData, totalData});
})

router.get("/add-ads", (req, res) => {
    res.render("pages/add-ads")
})

router.get("/add-webinares", (req, res) => {
    res.render('pages/add-webinares')
})

router.post("/add-ads",upload.single('file'), async(req, res) => {

    let file = path.join(__dirname , "../../uploads/"+req.file.filename);
    let destination = "ads";
    let uid = uuid();
    let linkRedirect = req.body.link
    let category = req.body.category

    const url = await uploadPhoto(path.normalize(file) , req.file.filename , destination);

    var data = {
        urlphoto: url,
        uid: uid,
        linkRedirect: linkRedirect,
        category: category
    }

    if(url != null && url != "") {
      var status =  providers.addAds(data)
      if(status) {
        res.redirect("/admin-main")
      }else {
        res.status(500).send('Opps ocoreu uma falha!')  
      }
    } else {
        res.status(500).send('Opps ocoreu uma falha!')  
    }

})

router.post("/add-webinar",urlencodedParser ,async(req, res) => {
    var data = req.body;
    var uid = uuid()
    data["uid"] = uid;
    let status = await providers.addWebinar(data);
    if(status) {
        res.redirect("/webinar")
    } else {
        res.redirect("/webinar")
    }
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
  
router.get("/register_buyer" , async(req, res) => {

const sessionCookie = req.cookies.session || "";
var data = [];
var dataSchedule = [] ;

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(async(user) => {

        var data = await providers.getUserById(user.uid);
        res.locals.title = data.name;
            res.render('pages/register-buyer.html', {
                data
            });  
   
    })
    .catch((error) => {
        console.log(error);
      //res.redirect("/register");
    });

})

router.post("/register_buyer",urlencodedParser, async(req, res) => {
   let data = req.body;
   data["uid"] = uuid();
   var status = await providers.addBuyer(data);
   if(status) {
       res.status(200).send("Adicionado com sucesso")
   }else {
       res.status(500).send("Ocoreu uma falha")
   }
})


router.get('/exhibitor' , async(req , res) => {
 
    var list = await providers.getExhibitors();
    if(list.length > 8) {
        list = list.slice(0, 8)
    }

    res.render('pages/exhibitor.html' , {
        list
    });

}); 


router.post('/schedule-chat', urlencodedParser , async(req , res) => {
  

    var scheduleUid = uuid();
    var data = req.body;
    data["uid"] = scheduleUid;
    var link = await getLink();
    data["linkChat"] = link;
    const sessionCookie = req.cookies.session || "";

    console.log(data)
    admin
        .auth()
        .verifySessionCookie(sessionCookie, true )
        .then(async(user) => {

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
 


})


async function scheduleChat(data, res) {
   
    var status = await providers.addScheduleChat(data);
    var status2 = await providers.scheduleChatUsers(data);
    
    res.status(200).send({status: 200, message: "success"})
}

// async function scheduleChatUsers(data, res) {
//     var status = await providers.scheduleChatUsers(data);
//     if(status) {
//         res.end(JSON.stringify({ status: "success" }));    
//     } else {
//         res.end(JSON.stringify({ status: "error" }));
//     }
// }


router.get('/schedule-chat' , (req , res) => {
 providers.countContact(req.query.id)

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

router.get('/webinar', async(req , res) => {
    var dataWebinars = []
    db.collection('webinars').get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            var data = doc.data()
            data["link"] = utils.returnEmbedLink(data["link"])
            dataWebinars.push(data)
        })
        console.log(dataWebinars)
        res.render('pages/webinar.html', {dataWebinars})
    })

})


router.get("/add-live", (req, res) => {
    res.render("pages/add-live")
})

router.post("/add-live",urlencodedParser, async(req, res) => {
    var data = req.body
    data["link"] = utils.returnEmbedLink(data["link"])
    var status = await providers.addLive(data);
    if(status) {
        res.redirect("/admin-main")
    } else {
        res.status(500).send("Ocorreu uma falha")
    }
})

router.get('/tables-schedule', async(req , res) => {

    if(req.query.id == null) {
        res.redirect('/login-exhibitor');
    } 

    var data = await providers.getExhibitorById(req.query.id)
    var dataSchedule = await  providers.getExhibitorSchedule(req.query.id)

    console.log(dataSchedule)
  
    res.render('pages/tables-schedule.html', {
        data,dataSchedule
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


router.post("/uploadPerfil", upload.single('file') , async(req, res) => {
    
    let file = path.join(__dirname , "../../uploads/"+req.file.filename);
    let destination = "profiles";
    let userUid = req.body.uid;

    if(userUid == null || userUid == "") {
        return;
    }

    const url = await uploadPhoto(path.normalize(file) , req.file.filename , destination);

    var data = {urlphoto: url}
    if(url != null && url != "") {
        db.collection('users').doc( userUid ).update(data).then(() => {
            res.end();
        })
    } else {
        // todo send error
        res.status(500).send('Opps ocoreu uma falha!')  
    }
    
})


function removeFile(path) {
    try{
        fs.unlinkSync(path)
    } catch(err) {
        console.log(err)
    }
}

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

router.get("/add-photo-main", (req, res) => {
    res.render("pages/add-photo-main")
})

router.post("/add-photo-main", upload.single('file') ,async(req, res) => {
    let file = path.join(__dirname , "../../uploads/"+req.file.filename);
    let destination = "exhibitor";
    const url = await uploadPhoto(path.normalize(file) , req.file.filename , destination);
    const uid = uuid();

    const data = {
        uid: uid,
        url: url
    }

    if(url != null && url != "") {
        db.collection("gallery").doc(uid).set(data).then(()=> {
            res.redirect("/admin-main")
        }).catch((err)=> {
            res.redirect("/add-photo-main")
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
        res.end(JSON.stringify({ status: 500, message : "Ocoreu uma falha" }));
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
 
    removeFile(filepath)
    return imgUrl;

}



router.get('/admin' , async(req ,res) => {

    if(req.query.id == null) {
        res.redirect('/login-exhibitor');
    } 

    var scheduleCount = 0;

    await db.collection("institution").doc(req.query.id).collection("schedule").get()
    .then(querySnapshot => {
       scheduleCount = querySnapshot.size;
     });

     console.log(scheduleCount)


    var data = null;
    db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
        data = doc.data()

        if(data == null || data == undefined) {
            res.redirect('/login-exhibitor');
        }

        data["scheduleCount"] = scheduleCount;

        res.render('pages/admin.html' , {
            data
        });

    });
 

})


router.get('/exhibitor-page' , (req, res) => {

    if(req.query.id == null) {
        res.redirect('/404');
    } 
    var adsList = []
    var data = null;
    db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
        data = doc.data()
        if(data == null || data == undefined) {
            res.redirect('/404');
        }

         // count exhibitor visit 
         providers.countVisits(req.query.id, data.visits);
        

        var dataGallery = [];
        console.log(dataGallery);
        db.collection("institution").doc(req.query.id).collection("gallery").get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                dataGallery.push(doc.data())
            })

            db.collection("ads").get().then((query)=> {
                query.forEach(function(result){
                    adsList.push(result.data())
                })
                var position =[ Math.floor(Math.random() * adsList.length) + 0,  Math.floor(Math.random() * adsList.length) + 0]
                           
                res.render('pages/exhibitor-page.html' , {
                    data, dataGallery, adsList, position
                });
                    

            }) 


           
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

  removeFile(filepath);
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
router.post('/register' , async(req, res) => { 
    const sessionCookie = req.cookies.session || "";
    var data = req.body;

    admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(async(user) => {
        data["uid"] = user.uid;
        console.log(data)
        var state = await addUser(data);
       
        res.status(200).send({status:200, message: "Cadastrado com sucesso"})
    })
    .catch((error) => {
        res.redirect("/register" , {
            error
        });
    });

});

// add user to the database //
async function addUser(data) {
    await db.collection('users').doc(data.uid).set(data)
    .then(function() {     
      return true    
    })
   .catch(function(error) {
        console.log(error)
        return false
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
       visits: 0,
       countContact: 0
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