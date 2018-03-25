let Helper = require("../Helpers");

module.exports.enableCORS = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}

module.exports.timeValidation = function (req, res, next){
  // console.log(Helper.isValidTimestamp(req.params.startTime));
  if (req.params.startTime && !Helper.isValidTimestamp(req.params.startTime)){
    return res.status(400).json({error: "The start time has to be a valid timestamp"});
  }
  
  if (req.params.endTime && !Helper.isValidTimestamp(req.params.endTime)){
    return res.status(400).json({error: "The end time has to be a valid timestamp"});
  }
  
  next();
}