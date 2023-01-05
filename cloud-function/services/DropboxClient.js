const { Dropbox } = require("dropbox") ;
const SecretManager = require("./SecretManager")
// require("dotenv").config()

const clientId = process.env.dbx_key 
const clientSecret = process.env.dbx_secret 
class DropboxClient {
    constructor(){
        this.secretManager = new SecretManager()
        this.token 
        this.dbx 
    }
    async initialize(){
        try {
            this.token = JSON.parse(await this.secretManager.getToken())
            this.dbx = new Dropbox({accessToken: this.token.result.access_token, refreshToken: this.token.result.refresh_token, clientId, clientSecret }); 
        } catch (error) {
            throw error
        }
    }

    async listFiles(path){
        try {
        
            const { result } = await this.dbx.filesListFolder({ path });
            return result
        } catch (error) {
            throw error
        }
    }
}


module.exports = DropboxClient

