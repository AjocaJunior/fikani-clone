const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const port =  3000 || process.env.PORT;



// set static file
app.use(express.static(__dirname + '/public'));

// set the view engine to ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html',require('ejs').renderFile);

const urlencodedParser = bodyParser.urlencoded({extended:false})

// routes
app.use(require('./routes/index.js'));

app.listen(3000);
console.log('3000 is the magic port');