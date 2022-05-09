const path= require('path')
const express= require('express')
const hbs = require('hbs')
const app = express()
const port = process.env.PORT || 3000
var bodyParser = require("body-parser")
const publicDirectoryPath = path.join(path.join(__dirname, '../public'))
const viewsPath = path.join(__dirname, 'templates/views')
const partialsPath = path.join(__dirname,'templates/partials')
var Imap = require('imap'),inspect = require('util').inspect;

app.set('view engine','hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectoryPath))
app.use(bodyParser.urlencoded({ extended: true }))
app.get('',(req, res)=> {
  res.render('index')
}) 

app.post('/log', (req,res)=> {
  const mail = req.body.mail
  const password = req.body.password
  const server = req.body.server
console.log(server)
  imapFunction(mail,password,server.toLowerCase())
  
  res.render('log')
})

app.listen(port, () =>{
  console.log('Server is up on  port '+port+'!')
})


function imapFunction(mail, psw,server) {

    var imap = new Imap({
      user: mail,
      password: psw,
      host: server,
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
    }
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err) throw err;
      var f = imap.seq.fetch('1:10', {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
      });
      f.on('message', function(msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
          var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
          });
        });
        msg.once('end', function() {
          console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
        imap.end();
      });
    });
  });

  imap.once('error', function(err) {
    console.log(err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });

  imap.connect();
}