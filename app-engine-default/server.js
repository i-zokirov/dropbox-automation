import express from "express";
import expressAsyncHandler from "express-async-handler";
import { notFound, errorHandler } from "./middleware/errorHandlers.js";
import { DropboxAuth } from "dropbox";
import SecretManager from "./services/SecretManager.js";
import OAuth from "./services/OAuth.js";
// ==== COMMENT BEFORE DEPLOYMENT
// import dotenv from "dotenv";
// dotenv.config();
const app = express();
app.use(express.json());

const dbxAuth = new DropboxAuth({
    clientId: process.env.dbx_key,
    clientSecret: process.env.dbx_secret,
});
const oauth = new OAuth();
const secretManager = new SecretManager();

// ROUTE HANDLERS

app.get("/", (req, res) => {
    res.send("Application is running");
});

app.get(
    "/authenticate",
    expressAsyncHandler(async (req, res) => {
        try {
            const authUrl = await dbxAuth.getAuthenticationUrl(
                process.env.redirectUrl,
                null,
                "code",
                "offline"
            );
            res.redirect(authUrl);
        } catch (error) {
            throw error;
        }
    })
);

app.get(
    "/api/token",
    expressAsyncHandler(async (req, res) => {
        try {
            const { code } = req.query;
            const { result } = await dbxAuth.getAccessTokenFromCode(
                process.env.redirectUrl,
                code
            );

            await secretManager.writeToken(result, "dropbox-token");
            res.send("Token has been successfully saved");
        } catch (error) {
            throw error;
        }
    })
);

// GOOGLE AUTHENTICATION
app.get("/authenticate/google", (req, res) => {
    const authUrl = oauth.generateUrl();
    res.redirect(authUrl);
});

app.get(
    "/api/google-token",
    expressAsyncHandler(async (req, res) => {
        const { code } = req.query;
        const token = await oauth.generateToken(code);
        await secretManager.writeToken(token, "google-task-token");
        res.send("Token has been successfully saved");
    })
);

// ERROR HANDLING MIDDLEWARE
app.use(notFound);
app.use(errorHandler);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Application is listening on port ${PORT}...`);
});
