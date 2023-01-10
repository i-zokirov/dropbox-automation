const GoogleSheet = require("./services/GoogleSheet");
const Task = require("./services/Tasks");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const spreadsheetId = process.env.reportsheetId;
const excludedSheets = process.env.excluded.includes(",")
    ? process.env.excluded.split(",")
    : process.env.excluded;
const googlesheet = new GoogleSheet(spreadsheetId);
const taskApi = new Task();

async function generateTasks() {
    await taskApi.initialize();
    const { items: taskListItems } = await taskApi.getTaskLists();
    const sheets = await googlesheet.getSheets();
    for (let sheet of sheets) {
        const sheetTitle = sheet.properties.title;
        if (
            excludedSheets.includes(sheetTitle) ||
            sheetTitle === excludedSheets
        )
            continue;
        console.log(`Processing ${sheetTitle}`);
        let taskList;
        // check whether tasklist exists for sheet title
        if (!taskListItems.some((list) => list.title === sheetTitle)) {
            console.warn(`NO Tasklist for ${sheetTitle}`);
            taskList = await taskApi.createTaskList(sheetTitle);
            console.info(`NEW Tasklist created for ${sheetTitle}`);
        } else {
            taskList = taskListItems.find(
                (listItem) => listItem.title === sheetTitle
            );
        }

        const tasksObject = await taskApi.getTaskAsObject(taskList.id);

        const invoices = await googlesheet.getSheetDataAsObject(sheetTitle);
        for (let invoice of invoices) {
            const currentInvoiceTitle = invoice["Document name"];
            console.log(`PROCESSING ${currentInvoiceTitle}`);

            if (!tasksObject[currentInvoiceTitle]) {
                await taskApi.createTask(taskList.id, {
                    title: currentInvoiceTitle,
                });
                console.info(`NEW Task created ${currentInvoiceTitle}`);
            } else {
                console.log(`SKIPPED ${currentInvoiceTitle}`);
            }
        }
    }
}

exports.generateTasks = async (req, res) => {
    try {
        await generateTasks();
        res.end();
    } catch (error) {
        console.error(error);
        return;
    }
};

// (async function () {
//     try {
//         await generateTasks();
//     } catch (error) {
//         console.error(error);
//         return;
//     }
// })();
