let rp = require("request-promise");
let cheerio = require("cheerio");

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
    
    let $ = res.$;
    // User info is divided into 7 sections
    // 0. Profile picture <img src=link>
    // 1. Social media links in <h1><a href=githubLink></a><a href=linkedinLink></a></h1>
    // 2. Name <h1>
    // 3. Location <h1>
    // 4. Bio <h1.bio> (can be empty)
    // 5. Score
    // 6. Row of accomplishments
    let userInfo = $(".bio").siblings();
    
    return {
        profile_pic: $(userInfo[0]).attr("src"),
        name: $(userInfo[2]).text(),
        location: $(userInfo[3]).text(),
        score: $(userInfo[4]).text().replace("[", "").replace("]", "").trim()
    }
    
}