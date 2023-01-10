if (process.env.NODE_ENV !== "production") require("dotenv").config();

module.exports.clientId = process.env.dbx_key;
module.exports.clientSecret = process.env.dbx_secret;
