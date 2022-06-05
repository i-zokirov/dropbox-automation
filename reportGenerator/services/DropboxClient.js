const { Dropbox } = require("dropbox") ;
const SecretManager = require("./SecretManager")

class DropboxClient {
    constructor(){
        this.secretManager = new SecretManager()
        this.token 
        this.dbx 
    }
    async initialize(){
        try {
            this.token = JSON.parse(await this.secretManager.getToken())
    
            this.dbx = new Dropbox({accessToken: this.token.result.access_token, refreshToken: this.token.result.refresh_token}); 
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


//  const listFiles = async(path) => {
//     try {
        
//         const { result } = await dbx.filesListFolder({ path });
//         return result
//     } catch (error) {
//         throw error
//     }
// }

module.exports = DropboxClient

