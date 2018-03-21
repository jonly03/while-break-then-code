let express = require("express");
let bodyParser = require("body-parser");

let firebaseDB = require("./Firebase");
let Crawler = require("./Crawler");

let app = express();

let jsonParser = bodyParser.json();


let PORT = process.env.PORT;
let IP = process.env.IP;




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
      return res.send(snap.val());
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

app.listen(PORT, IP);