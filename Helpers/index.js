module.exports.getUsersArray = function(usersFirebaseObject) {
    // Formats users firebase objects into array of users to send to client
    // users is a bunch of objects with usernames as keys
    let usernames = Object.keys(usersFirebaseObject);
    
    return usernames.map( username => { 
        let newUserObj = usersFirebaseObject[username];
        newUserObj.username =  username;
        return newUserObj; 
    })
    
    // let users = [];
    
    // let data = usersFirebaseObject;
    // let keys = Object.keys(data);
  
    // for (let i=0; i < keys.length; i++){
    //     var user = data[keys[i]];
    //     user.username = keys[i];
    //     users.push(user);
    // }
    
    // return users;
}

module.exports.filterUsers = function (usersArray, type, filters){
    let predicate;
    
    switch (type) {
        case 'from':
            predicate = value => {
                return value.time >= filters.from;
            }
            break;
            
        case 'to':
            predicate = value => {
                return value.time <= filters.to;
            }
            break;
            
        case 'span':
            predicate = value => {
                return (value.time >= filters.from && value.time <= filters.to);
            }
            break;
        
        default:
            predicate = value => {
                return false;
            }
            break;
    }
    
    usersArray.forEach(user => {
        user.scores = user.scores.filter(predicate);
    })

    return usersArray.filter(user => {
        return user.scores.length > 0;
    })
}

module.exports.isValidTimestamp = function  (timestamp){
    if (isNaN(Number(timestamp))) return false;
    
    return (new Date(Number(timestamp))).getTime() > 0;
}

