let rp = require("request-promise");

let firebaseDB = require("../Firebase");



let fccAPIPath = "https://www.freecodecamp.org/api/users/get-public-profile?username=";

function userExists(profileData, username) {
    console.log(profileData)
    const {
        entities: {
            user
        }
    } = profileData;

    let res = {};
    if (!user[username]) {
        res.error = "User not found";
        return res;
    }

    res = user[username];

    return res;
}

function getProfiles(profiles, usersObject) {
    return new Promise((resolve, reject) => {
        let usernames = Object.keys(usersObject);

        usernames.forEach(async username => {
            // Assume our users have fcc public profiles
            // Todo: Check if they don't and delete their info from firebase
            let fccProfileData = await rp(fccAPIPath + username);

            profiles[username] = {};
            profiles[username] = Object.assign({},
                constructNewUserProfile(JSON.parse(fccProfileData).entities.user[username], usersObject[username])
            );
            if (Object.keys(profiles).length === usernames.length) {
                console.log(profiles)
                // Update firebase with new profiles
                firebaseDB.ref('/users').set(profiles)
                    .catch(error => reject(error));

                resolve(profiles);

            }
        })
    })

}

function constructNewUserProfile(currentUserProfile, prevUserProfile) {
    // User info is divided into 7 sections
    // 0. Profile picture 
    // 2. Name
    // 3. Location 
    // 4. Score
    const {
        picture: profile_pic,
        name,
        location,
        points: score
    } = currentUserProfile;

    let currScore = {
        time: Date.now(),
        score
    }

    let scores = prevUserProfile ? prevUserProfile.scores : [currScore];


    // Only add a score if the score has changed
    if (prevUserProfile && prevUserProfile.scores && prevUserProfile.scores[prevUserProfile.scores.length - 1].score !== score) {
        scores.push(currScore);
    }

    return {
        profile_pic,
        name,
        location,
        score,
        scores,
    }
}

module.exports.getUserProfile = function (username) {
    return rp(fccAPIPath + username);
}

module.exports.parseProfileData = function (fccProfileData, username) {
    let res = userExists(fccProfileData, username);
    if (res.error) {
        return {
            error: 404,
            message: res.error
        }
    }

    return constructNewUserProfile(res);
}

module.exports.crawl = function () {
    return new Promise((resolve, reject) => {
        // Get all users from firebase
        let ref = firebaseDB.ref("/users");

        // Crawl freecodecamp.org to parse user's profile info
        ref.once("value")
            .then(async snap => {
                let profiles = {}
                let newProfiles = await getProfiles(profiles, snap.val())
                resolve(newProfiles);
            })
            .catch(error => {
                reject(error);
            })
    })
}