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

async function getBuyers() {
    var list = []
    await db.collection('buyers').get().then((querySnapshot) => {
        querySnapshot.forEach((buyersDoc) => {

            var data = buyersDoc.data()
            if(data.urlphoto == "") {
                data["urlphoto"] = "https://firebasestorage.googleapis.com/v0/b/fikani.appspot.com/o/perfil%2Funnamed.jpg?alt=media&token=234789f8-f514-4ef0-aee4-36f534f03507";
            }
            list.push(data);
        })
    })
    return list
}

async function getUserById(uid) {
   var data = await db.collection('users').doc(uid).get().then(function(doc) {
        return data = doc.data()
   })

   return data
}


async function getUserSchedule(uid) {
    var dataSchedule = await db.collection("users").doc(uid).collection("schedule").get().then(querySnapshot => {
        var momentoData = []    
        querySnapshot.forEach(doc => {
            momentoData.push(doc.data())
        });
        return momentoData
    });
 
    return dataSchedule
}

async function addAds(data) {
    await db.collection('ads').doc( data.uid ).set(data).then(() => {
       return true
    }).catch((err) => {
        return false
    })
}

async function addWebinar(data) {
    db.collection("webinars").doc(data.uid).set(data).then(() => {
        return true
     }).catch((error) => {
         return true
     })
}

async function addBuyer(data) {
    db.collection("buyers").doc(data.uid).set(data)
    .then(()=>{
        return true
    })
    .catch((error)=> {
        return false
    })
}

async function addScheduleChat(data) {
    await db.collection('institution').doc(data.exhibitorUid).collection('schedule').doc( data.uid ).set(data)
    .then(function() {
       return true         
    })
    .catch(function(error) {   
       return false
    });

}

async function scheduleChatUsers(data) {
    await db.collection('institution').doc(data.exhibitorUid).get().then(function(doc) {
        var instData = doc.data();
        data["name"] = instData.name;
    })
    await db.collection('users').doc(data.userUid).collection('schedule').doc( data.uid ).set(data)
        .then(function() {
           return true           
        })
        .catch(function(error) {
          return false
        })
}

async function addLive(data) {
   await db.collection("event").doc("live").set(data).then(()=> {
        return true
    }).then((err)=> {
        return false
    })
}

async function getExhibitorById(uid) {
    var data = await db.collection('institution').doc(uid).get().then(function(doc) {
       return doc.data()
    });
    return data
}

async function getExhibitorSchedule(uid) {
    var data = await db.collection('institution').doc(''+req.query.id).get().then(function(doc) {
       return doc.data()
    });
    return data
}
  

  module.exports = {
      getTotalValue,
      removeVideo,
      updateContact,
      getAdsList,
      getLive,
      getExhibitors,
      getGallery,
      countVisits,
      countContact,
      getBuyers,
      getUserById,
      getUserSchedule,
      addAds,
      addWebinar,
      addBuyer,
      addScheduleChat,
      scheduleChatUsers,
      addLive,
      getExhibitorById,
      getExhibitorSchedule
  }
