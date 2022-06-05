const { DropboxAuth } = require("dropbox")
const SecretManager = require("./secret-manager")
const dbxAuth = new DropboxAuth({clientId: process.env.dbx_key, clientSecret: process.env.dbx_secret})

exports.generateToken = async(req, res) => {
    try {
        const { code } = req.query;
        const token = await dbxAuth.getAccessTokenFromCode(process.env.redirectUrl, code)
        const secretManager = new SecretManager()

        await secretManager.writeToken(token)
        res.send("Token has been successfully saved")
    } catch (error) {
        throw error
    }
}