function returnEmbedLink(link) {
    var vars = link.split("=");
    var linkId = vars[1];
    var embedLink = "https://www.youtube.com/embed/"+linkId
    return embedLink
}

function getDescription(description) {
    let newDescription = ""
    var regex = /(<([^>]+)>)/ig
    if(description.length > 80) {
        newDescription = description.substring(0, 80).replace(regex, "").trim()+".."
    } else {
        newDescription = description
    }
    return newDescription
}


module.exports = {
    getDescription,
    returnEmbedLink
}