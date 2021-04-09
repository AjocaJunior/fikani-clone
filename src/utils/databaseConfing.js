const firebase = require("firebase/app");
const admin = require("firebase-admin");
const {Storage} = require('@google-cloud/storage');

//const { database } = require("firebase-admin");

// require("firebase/auth");
// require("firebase/storage")
// require("firebase/firestore");

// Initialize Firebase admin
const serviceAccount = require('../../fikani-firebase-adminsdk-nhqwx-30a29e774a.json');
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
    

  firebase.initializeApp(firebaseConfig);
  const db = admin.firestore();

  //bucket confing
  const storage  = new Storage({
    projectId: "fikani",
    keyFilename: serviceAccount 
  });

  const bucket = storage.bucket("fikani.appspot.com");


  module.exports = {
      db, bucket, admin
  }

  