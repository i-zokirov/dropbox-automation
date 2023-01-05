const GoogleSheet = require("./GoogleSheet")
require("dotenv").config()


const execute = async() => {
    const gsheet = new GoogleSheet(process.env.backupsheetId)
    // const backUp = new GoogleSheet(process.env.backupsheetId)
    const sheets = await gsheet.getSheets()


    for(let sheet of sheets){
        // await backUp.appendSheet(sheet.properties.title)
        const rows = await gsheet.getRows(`${sheet.properties.title}!A2:B100`)
        // await backUp.appendRow(rows,`${sheet.properties.title}`)
        const newRows = []
        if(rows)
            if(rows.length )
                for(let row of rows){
                    if(row[0].includes(".xlsx")){
                        newRows.push([row[0].split(".")[0], row[1]])
                    } else {
                        newRows.push(row)
                    }
                }

                await gsheet.update(newRows, `${sheet.properties.title}!A2:B100`)


            console.log(newRows)
    }
}

execute()