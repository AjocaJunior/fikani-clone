const {db} = require("./databaseConfing")

  async function getTotalValue() {
    let data = {
        totalUsers: 0,
        totalExhibitor: 0,
        totalBuyers: 0,
        totalAds: 0
    }

    await db.collection("users").get().then((querySnapshot) => { 
      data.totalUsers = querySnapshot.size
    })

    await db.collection("institution").get().then((querySnapshot) => { 
        data.totalExhibitor = querySnapshot.size
    })

    await db.collection("buyers").get().then((querySnapshot) => {
        data.totalBuyers = querySnapshot.size
    })

    await db.collection("ads").get().then((querySnapshot) => {
        data.totalAds = querySnapshot.size
    })

    return data;
  }


  async function removeVideo(uid, data) { 
    db.collection('institution').doc( uid ).update(data).then(()=> {
        return true
    }).catch((err) => {
        return false
    })
  }

  async function updateContact(data) { 
    db.collection("institution").doc(data.uid).update(data).then(() => {
       return true
    }).catch((err) => {
       return false
    })
  }
 
  
  async function getAdsList() {
    var adsList = []

    await db.collection("ads").get().then((query)=> {
        query.forEach(function(result){
            adsList.push(result.data())
        })
    }) 

    return adsList
  }


 async function getLive() { 
    var liveData
    await db.collection("event").doc("live").get().then((query) => {
        liveData = query.data()
    })
    return liveData
  }


  async function getExhibitors() {
  
    var exhibitorList = []
    await db.collection("institution").get().then((querySnapshot) => {
       
            querySnapshot.forEach((instDoc) => {
                             
            if(instDoc.data().imgUrl == null || instDoc.data().imgUrl == '' ) {
                instDoc.data().imgUrl = 'https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/perfil%2Funnamed.jpg?alt=media&token=234789f8-f514-4ef0-aee4-36f534f03507';
            }
            exhibitorList.push(instDoc.data())
        })
    })

    return exhibitorList
  }

  async function getGallery() {
    var listGallery = []
    await db.collection("gallery").get().then((query) => {
        query.forEach((dataGallery) => { listGallery.push(dataGallery.data()) })
    })
    return listGallery
  }
  

  module.exports = {
      getTotalValue,
      removeVideo,
      updateContact,
      getAdsList,
      getLive,
      getExhibitors,
      getGallery
  }
