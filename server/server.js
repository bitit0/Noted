const express = require("express");
const admin = require(".\\firebaseAdmin.js");
const app = express();
const cors = require("cors");
const port = 3001;

app.use(cors());
app.use(express.json());

app.post("/get-uid", async (req, res) => {

    const { email } = req.body;

    try {

        const userRecord = await admin.admin.auth().getUserByEmail(email);

        res.status(200).json({ uid: userRecord.uid });
    } catch (error) {
        console.error("Error fetching user: ", error);
        res.status(400).json({ error: "User not found or error fetching user." });
    }

});

app.listen(port, () => {
    console.log("Server is running.")
})