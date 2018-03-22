module.exports.getUsersArray = function(usersFirebaseObject) {
    // Formats users firebase objects into array of users to send to client
    let users = [];
    
    let data = usersFirebaseObject;
    let keys = Object.keys(data);
  
    for (let i=0; i < keys.length; i++){
        var user = data[keys[i]];
        user.username = keys[i];
        users.push(user);
    }
    
    return users;
}