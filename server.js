

let express = require("express");
let bodyParser = require("body-parser");

let firebaseDB = require("./Firebase");
let Crawler = require("./Crawler");

let Helper = require("./Helpers");

let app = express();

let jsonParser = bodyParser.json();


let PORT = process.env.PORT;
let IP = process.env.IP;

// Enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post("/users", jsonParser, (req, res) =>{
  if (!req.body || !req.body.username) return res.status(404).json({message:"The payload has to have a username"});
  
  let { username } = req.body;
  Crawler.getUserProfile(username)
    .then( htmlString =>{
      
      let data = Crawler.parseWebPage(htmlString);
      
      if (data.error) return res.status(404).json(data);
      
      // Save new user into firebase
      let ref = firebaseDB.ref("/users")
      ref.child(username).set(data)
      .then( () => {
        return res.status(200).json(data);
      })
      
    })
    .catch(error =>{
      console.log(error);
      return res.status(404).json(error);
    })
})

app.get("/users", (req, res) =>{
  let ref = firebaseDB.ref("/users");
  ref.once("value")
    .then(snap =>{
      return res.send(Helper.getUsersArray(snap.val()));
    })
    .catch(error => {
      return res.status(404).send(error);
    })
})

app.get("/users/:username", (req, res) =>{
  
  let { username } = req.params;
  
  let ref = firebaseDB.ref(`/users/${username}`);
  ref.once("value")
    .then(snap =>{
      return res.send(snap.val());
    })
    .catch(error => {
      return res.status(404).send(error);
    })
  
})

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

let server = app.listen(PORT, IP, () => {
  console.log(`Listenning at ${IP}: ${PORT}`);
});

//SOCKET IO
// let io = require("socket.io").listen(server);

// // When clients connect, go crawl freecodecamp.org 
// // For profile updates of users and broadcast them to all connected sockets
// io.on('connection', (client) =>{
  
//   client.on("crawling", async function(data){
  
//     Crawler.crawl()
//       .then(() => {
//         // Listen to users profiles update and let our clients know
//         firebaseDB.ref('/users').on('value', (snap) =>{
//           let updatedProfiles = snap.val();
//           client.emit("done_crawling", updatedProfiles); // Send profiles back to calling client
//           client.broadcast.emit("done_crawling", updatedProfiles); // Send profiles to all other listening clients
//         })
//       }) 
//   });
  
//   client.on('disconnect', () =>{
//     console.log("disconnected");
//   })
// })
