let rp = require("request-promise");
let cheerio = require("cheerio");
let firebaseDB = require("../Firebase");

let fccPath = "https://www.freecodecamp.org/";

function userExists(htmlString){
    let $ = cheerio.load(htmlString);
    let res = {};
    
    if (!$(".bio").siblings().length){
        res.error = "User not found";
        return res;
    }
    
    res.$ = $;
    return res;
}

function getProfiles(profiles, usersObject){
    return new Promise ((resolve, reject) => {
        let usernames = Object.keys(usersObject);
        
        usernames.forEach(async username => {
            // Assume our users have fcc public profiles
            // Todo: Check if they don't and delete their info from firebase
            let htmlString = await rp(fccPath + username);
            let $ = cheerio.load(htmlString);
            
            profiles[username] = {};
            profiles[username] = Object.assign(
                {}, 
                constructNewUserProfile($, usersObject[username])
            );
            if (Object.keys(profiles).length === usernames.length){
                
                // Update firebase with new profiles
                firebaseDB.ref('/users').set(profiles)
                    .catch(error => reject(error));
                    
                resolve(profiles);
                    
            }
        })
    })
    
}

function constructNewUserProfile($, prevUserProfile){
    // User info is divided into 7 sections
    // 0. Profile picture <img src=link>
    // 1. Social media links in <h1><a href=githubLink></a><a href=linkedinLink></a></h1>
    // 2. Name <h1>
    // 3. Location <h1>
    // 4. Bio <h1.bio> (can be empty)
    // 5. Score
    // 6. Row of accomplishments
    let userInfo = $(".bio").siblings();
    let profile_pic = $(userInfo[0]).attr("src");
    let name = $(userInfo[2]).text();
    let location = $(userInfo[3]).text();
    let score = $(userInfo[4]).text().replace("[", "").replace("]", "").trim();

    let scores = prevUserProfile ? prevUserProfile.scores : [];
    
    let currScore = {
        time: Date.now(),
        score
    }
    scores.push(currScore);
    return {
        profile_pic,
        name,
        location,
        score,
        scores,
    }
}

module.exports.getUserProfile = function (username){
    return rp(fccPath + username);
}

module.exports.parseWebPage = function (htmlString){
    let res = userExists(htmlString);
    if (res.error){
        return {
            error: 404,
            message: res.error
        }
    }
    
    return constructNewUserProfile(res.$);
}

module.exports.crawl = function (){
    return new Promise((resolve, reject) => {
        // Get all users from firebase
        let ref = firebaseDB.ref("/users");
        
        // Crawl freecodecamp.org to parse user's profile info
        ref.once("value")
            .then( async snap => {
                let profiles = {}
                let newProfiles = await getProfiles(profiles, snap.val())
                resolve(newProfiles);
            })
            .catch( error =>{
                reject(error);
            })  
    })
}