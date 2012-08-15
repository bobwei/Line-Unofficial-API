var LINE = require('./line.js');

var line     = new LINE();
var email    = process.argv[2];
var password = process.argv[3];

line.login(email, password, function(error, result, headers) {
    if (error) {
        return;
    }
    
    console.log(JSON.stringify(headers))

    // ログイン成功
    
    /*
    line.getProfile(function(error, result) {
        console.log(result)
        //console.log(JSON.stringify(result));
    });
    */
});
