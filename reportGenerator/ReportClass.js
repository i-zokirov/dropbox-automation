const DropboxClient = require("./services/DropboxClient.js");
const GoogleSheet = require("./services/GoogleSheet.js");
const moment = require("moment-timezone");
const mm = require("moment");
require("dotenv").config();
mm.locale("uz");

class ReportClass {
    constructor() {
        this.gsheet = new GoogleSheet(process.env.reportsheetId);
        this.dbx = new DropboxClient();
    }
    async initialize() {
        await this.dbx.initialize();
    }

    convertToTimezone(time, zone) {
        const format = "YYYY/MM/DD HH:mm:ss ZZ";
        return moment(time, format).tz(zone).format(format);
    }

    buildSheetData(files, useHeaders = true) {
        const rows = [];
        for (let file of files) {
            const uztime = this.convertToTimezone(
                file.client_modified,
                "Asia/Tashkent"
            );
            rows.push([
                file.name.split(".")[0],
                `${mm(uztime.split(" ")[0].split("/").join("-")).format("L")} ${
                    uztime.split(" ")[1].split(":")[0]
                }:${uztime.split(" ")[1].split(":")[1]}`,
            ]);
        }
        return useHeaders ? [["Document name", "Created"], ...rows] : rows;
    }

    async processMoreFolders(folders, rootFolder) {
        try {
            let moreFolders = [];
            for (let folder of folders) {
                const { entries } = await this.dbx.listFiles(
                    folder.path_display
                );
                const onlyFiles = entries
                    .filter((item) => item[".tag"] !== "folder")
                    .sort((a, b) => a.client_modified - b.client_modified);
                moreFolders = entries.filter(
                    (item) => item[".tag"] === "folder"
                );

                if (onlyFiles.length) {
                    const tabRecords = await this.gsheet.getRows(
                        rootFolder.name
                    );
                    let useHeaders = true;

                    if (tabRecords) {
                        if (tabRecords.length) {
                            if (
                                tabRecords[0].includes("Document name") &&
                                tabRecords[0].includes("Created")
                            ) {
                                useHeaders = false;
                            }
                        }

                        const filteredNewFiles = [];
                        if (tabRecords.length) {
                            for (let file of onlyFiles) {
                                if (
                                    !tabRecords.some(
                                        (item) =>
                                            item[0] === file.name.split(".")[0]
                                    )
                                ) {
                                    filteredNewFiles.push(file);
                                }
                            }
                        }
                        if (filteredNewFiles.length) {
                            await this.gsheet.appendRow(
                                this.buildSheetData(
                                    filteredNewFiles,
                                    useHeaders
                                ),
                                rootFolder.name
                            );
                        }
                    } else {
                        await this.gsheet.appendRow(
                            this.buildSheetData(onlyFiles, useHeaders),
                            rootFolder.name
                        );
                    }
                }
            }
            return moreFolders.length ? moreFolders : [];
        } catch (e) {
            throw e;
        }
    }

    async run() {
        try {
            const { entries } = await this.dbx.listFiles("");
            const onlyFolders = entries.filter(
                (item) => item[".tag"] === "folder"
            );
            const rootFolders = [];
            const exclude = ["ЭСКИ", "Маркировки", "Шартномалар"];
            for (let folder of onlyFolders) {
                if (!exclude.includes(folder.name)) {
                    rootFolders.push(folder);
                }
            }
            let sheets = await this.gsheet.getSheets();

            const sheetsToBeDeleted = [];
            const excludedSheets = ["Contacts", "SMS Text"];
            for (let sheet of sheets) {
                if (!excludedSheets.includes(sheet.properties.title.trim())) {
                    if (
                        !rootFolders.some(
                            (folder) =>
                                folder.name.trim() ===
                                sheet.properties.title.trim()
                        )
                    ) {
                        sheetsToBeDeleted.push(sheet);
                    }
                }
            }

            if (sheetsToBeDeleted.length) {
                sheets = sheets.filter(
                    (sheet) =>
                        !sheetsToBeDeleted.some(
                            (item) =>
                                item.properties.sheetId ===
                                sheet.properties.sheetId
                        )
                );
                await this.gsheet.deleteSheets(sheetsToBeDeleted);
            }

            sheets = sheets.filter(
                (sheet) => !excludedSheets.includes(sheet.properties.title)
            );
            for (let sheet of sheets) {
                await this.gsheet.clear(sheet.properties.title);
            }

            for (let rootFolder of rootFolders) {
                console.log(`PROCESSING - ${rootFolder.name}`);
                if (
                    !sheets.some(
                        (sheet) =>
                            sheet.properties.title.trim() ===
                            rootFolder.name.trim()
                    )
                ) {
                    await this.gsheet.appendSheet(rootFolder.name);
                }
                const { entries } = await this.dbx.listFiles(
                    rootFolder.path_display
                );
                const onlyFiles = entries
                    .filter((item) => item[".tag"] !== "folder")
                    .sort((a, b) => a.client_modified - b.client_modified);
                const folders = entries.filter(
                    (item) => item[".tag"] === "folder"
                );

                if (onlyFiles.length) {
                    const existingSheetData =
                        await this.gsheet.getSheetDataAsObject(rootFolder.name);

                    if (existingSheetData) {
                        if (existingSheetData.length) {
                            const filteredNewFiles = [];
                            for (let file of onlyFiles) {
                                if (
                                    !existingSheetData.some(
                                        (item) =>
                                            item["Document name"] ===
                                            file.name.split(".")[0]
                                    )
                                ) {
                                    filteredNewFiles.push(file);
                                }
                            }
                            if (filteredNewFiles.length) {
                                await this.gsheet.appendRow(
                                    this.buildSheetData(
                                        filteredNewFiles,
                                        false
                                    ),
                                    rootFolder.name
                                );
                            }
                        } else {
                            await this.gsheet.appendRow(
                                this.buildSheetData(onlyFiles, true),
                                rootFolder.name
                            );
                        }
                    }
                }

                if (folders.length) {
                    const moreFolders = await this.processMoreFolders(
                        folders,
                        rootFolder
                    );
                    if (moreFolders.length) {
                        const moreFolders2 = await this.processMoreFolders(
                            moreFolders,
                            rootFolder
                        );
                        if (moreFolders2.length) {
                            const moreFolders3 = await this.processMoreFolders(
                                moreFolders2,
                                rootFolder
                            );
                            if (moreFolders3.length) {
                                const moreFolders4 =
                                    await this.processMoreFolders(
                                        moreFolders3,
                                        rootFolder
                                    );
                                if (moreFolders4.length) {
                                    await this.processMoreFolders(
                                        moreFolders4,
                                        rootFolder
                                    );
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReportClass;
