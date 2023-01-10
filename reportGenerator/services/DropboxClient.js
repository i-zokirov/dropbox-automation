const { Dropbox } = require("dropbox");
const SecretManager = require("./SecretManager");
const { clientId, clientSecret } = require("../config");
class DropboxClient {
    constructor() {
        this.secretManager = new SecretManager();
        this.token;
        this.dbx;
    }
    async initialize() {
        try {
            this.token = JSON.parse(
                await this.secretManager.getToken("dropbox-token")
            );

            this.dbx = new Dropbox({
                accessToken: this.token.access_token,
                refreshToken: this.token.refresh_token,
                clientId,
                clientSecret,
            });
        } catch (error) {
            throw error;
        }
    }

    async listFiles(path) {
        try {
            const { result } = await this.dbx.filesListFolder({ path });
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = DropboxClient;
