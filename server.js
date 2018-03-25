

let express = require("express");
let bodyParser = require("body-parser");

let firebaseDB = require("./Firebase");
let Crawler = require("./Crawler");
let Helper = require("./Helpers");
let Middleware = require("./Middleware");

let CronJob = require("cron").CronJob;

let app = express();

let jsonParser = bodyParser.json();


let PORT = process.env.PORT;
let IP = process.env.IP;

// Enable CORS
app.use(Middleware.enableCORS);

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

app.get("/users/span/from/:startTime", Middleware.timeValidation, (req, res) =>{
  let { startTime } = req.params;
  
  firebaseDB.ref('/users').once('value')
    .then(snap => {
      let users = snap.val();
      
      let usersArray = Helper.getUsersArray(snap.val());
      
      let filteredUsers = Helper.filterUsers(
        usersArray, 
        "from", 
        {from: startTime}
      );
      
      return res.send(filteredUsers);
      
    })
    .catch(error => {
      return res.status(500).json(error);
    })
});

app.get("/users/span/to/:endTime", Middleware.timeValidation, (req, res) =>{
  let { endTime } = req.params;
  
  firebaseDB.ref('/users').once('value')
    .then(snap => {
      let users = snap.val();
      
      let usersArray = Helper.getUsersArray(snap.val());
      
      let filteredUsers = Helper.filterUsers(
        usersArray, 
        "to", 
        {to: endTime}
      );
      
      return res.send(filteredUsers);
      
    })
    .catch(error => {
      return res.status(500).json(error);
    })
});

app.get("/users/span/from/:startTime/to/:endTime", Middleware.timeValidation, (req, res) =>{
  let { startTime, endTime } = req.params;
  
  firebaseDB.ref('/users').once('value')
    .then(snap => {
      let users = snap.val();
      
      let usersArray = Helper.getUsersArray(snap.val());
      
      let filteredUsers = Helper.filterUsers(
        usersArray,
        "span", 
        {from: startTime, to: endTime}
      );
      
      return res.send(filteredUsers);
      
    })
    .catch(error => {
      return res.status(500).json(error);
    })
  
});



// app.get('/', function(req, res){
//   res.set('Content-Type', 'text/html'); // 'text/html' => mime type
//   res.sendFile(__dirname + '/index.html');
// });

let server = app.listen(PORT, IP, () => {
  console.log(`Listenning at ${IP}: ${PORT}`);
  
  // For testing purpose without having to wait for the cron job
  // Crawler.crawl()
  //   .then(() => {
  //   // Do nothing really
  //   console.log("Done crawling and updating the DB")
  //   })
  //   .catch((error) =>{
  //     console.log(error);
  //   })
});

// Use a Cron job to crawl the fcc for our user profile updates every 15 minutes
let crawlJob = new CronJob({
  cronTime: '*/15 * * * *',
  onTick: function(){
    console.log("Running crawling job...");
    
    Crawler.crawl()
      .then(() => {
      // Do nothing really
      console.log("Done crawling and updating the DB")
      })
      .catch((error) =>{
        console.log(error);
      })
  },
  start: true,
  timeZone: 'America/Los_Angeles'
})


// //SOCKET IO
// let io = require("socket.io").listen(server);

// // When clients connect, go crawl freecodecamp.org 
// // For profile updates of users and broadcast them to all connected sockets
// io.on('connection', (client) =>{
//   console.log("client connected");
//   client.on("crawling", async function(data){
  
//     Crawler.crawl()
//       .then(() => {
//         // Listen to users profiles update and let our clients know
//         firebaseDB.ref('/users').on('value', (snap) =>{
//           let updatedProfiles = Helper.getUsersArray(snap.val());
          
//           // Send profiles back to calling client
//           client.emit("done_crawling", updatedProfiles);
          
//           // Send profiles to all other listening clients
//           client.broadcast.emit("done_crawling", updatedProfiles); 
//         })
//       })
//       .catch((error) =>{
//         console.log(error);
//       })
//   });
  
//   client.on('disconnect', () =>{
//     console.log("disconnected");
//   })
// })
