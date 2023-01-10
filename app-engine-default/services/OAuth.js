import { promisify } from "util";
import { google } from "googleapis";
import { readFile } from "fs/promises";

const oathCredentials = JSON.parse(
    await readFile(new URL("../keys/oauth-client.json", import.meta.url))
);

class OAuth {
    constructor() {
        const { client_secret, client_id, redirect_uris } = oathCredentials.web;
        this.SCOPES = ["https://www.googleapis.com/auth/tasks"];
        this.google = google;
        this.oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            process.env.oauthRedirectUrl
        );
        this.auth;
    }

    generateUrl() {
        const options = {
            access_type: "offline",
            scope: this.SCOPES,
        };
        return this.oAuth2Client.generateAuthUrl(options);
    }

    async generateToken(code) {
        return await promisify(
            this.oAuth2Client.getToken.bind(this.oAuth2Client)
        )(code);
    }
}

export default OAuth;
