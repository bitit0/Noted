var admin = require("firebase-admin");

var serviceAccount = require("..\\key\\noted-11d5b-firebase-adminsdk-fbsvc-0f0b31050b.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = { admin };