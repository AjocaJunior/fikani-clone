const {db} = require("./databaseConfing")
getTotalValue()
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


  module.exports = {
      getTotalValue
  }
