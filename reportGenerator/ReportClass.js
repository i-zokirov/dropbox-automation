const DropboxClient = require( "./services/DropboxClient.js");
const GoogleSheet = require( "./services/GoogleSheet.js");
const moment = require("moment")
moment.locale("uz")

class ReportClass {
    constructor(){
        this.gsheet = new GoogleSheet(
            "1bvhO2hoB2tDUyonaz7BD4Klx23SJ0-li4Hv7W9IMvO4"
        );
        this.dbx = new DropboxClient()
    }
    async initialize(){
     
        await this.dbx.initialize()
    }

    buildSheetData(files, useHeaders = true){
        const rows = []
        for(let file of files){
            rows.push([file.name, `${moment(file.client_modified).format('L')} ${moment(file.client_modified).format('LT')}`])
        }
        return useHeaders ? [['Document name', "Created"], ...rows] : rows
    }


    async processMoreFolders(folders, rootFolder){
        try{
            let moreFolders = []
            for(let folder of folders){
                const { entries } = await this.dbx.listFiles(folder.path_display);
                const onlyFiles = entries.filter(item => item[".tag"] !== "folder").sort((a, b) => a.client_modified - b.client_modified)
                moreFolders = entries.filter(item => item[".tag"] === "folder")

                if(onlyFiles.length){
                    const tabRecords = await this.gsheet.getRows(rootFolder.name)
                    let useHeaders = true
                    if(tabRecords){
                        if(tabRecords[0].includes("Document name") && tabRecords[0].includes("Created")){
                            useHeaders = false
                        }
                    }
                    const sheetData = this.buildSheetData(onlyFiles, useHeaders)
                    await this.gsheet.appendRow(sheetData, rootFolder.name)
                }

                
            }
            return moreFolders.length ? moreFolders : []
        }catch(e){
            throw e
        }
    }

    async run(){
        try {
        
        const { entries } = await this.dbx.listFiles("");
        const rootFolders = entries.filter(item => item[".tag"] === "folder")
        const sheets = await this.gsheet.getSheets()
    
        for (let rootFolder of rootFolders){
            if (
                !sheets.some((sheet) => sheet.properties.title.trim() === rootFolder.name.trim())
            ) {
               await this.gsheet.appendSheet(rootFolder.name)
            }
            const {entries} = await this.dbx.listFiles(rootFolder.path_display)
            const onlyFiles = entries.filter(item => item[".tag"] !== "folder").sort((a, b) => a.client_modified - b.client_modified)
            const folders = entries.filter(item => item[".tag"] === "folder")

            if(onlyFiles.length){
                const sheetData = this.buildSheetData(onlyFiles)
                await this.gsheet.clear(rootFolder.name)
                await this.gsheet.appendRow(sheetData, rootFolder.name)
            } else {
                await this.gsheet.clear(rootFolder.name)
            }

            if(folders.length){
                const moreFolders = await this.processMoreFolders(folders, rootFolder)
                if(moreFolders.length){
                    const moreFolders2 = await this.processMoreFolders(moreFolders, rootFolder)
                    if(moreFolders2.length){
                         const moreFolders3 = await this.processMoreFolders(moreFolders2, rootFolder)
                         if(moreFolders3.length){
                             const moreFolders4 = await this.processMoreFolders(moreFolders3, rootFolder)
                             if(moreFolders4.length){
                                   await this.processMoreFolders(moreFolders4, rootFolder)
                             }
                         }
                    }
                }
            }
        }
    
        } catch (error) {
            throw error
        }
    }
}



module.exports = ReportClass


