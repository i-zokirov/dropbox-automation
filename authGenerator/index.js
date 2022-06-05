const { DropboxAuth } = require("dropbox")

const dbxAuth = new DropboxAuth({clientId: process.env.dbx_key, clientSecret: process.env.dbx_secret})

exports.generateAuthUrl = async(req, res) => {
    try {
        const authUrl = await dbxAuth.getAuthenticationUrl(process.env.redirectUrl, null, 'code', 'offline',)
        res.redirect(authUrl)
    } catch (error) {
        throw error
    }
}