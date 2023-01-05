const GoogleSheet = require("./services/GoogleSheet");
const Task = require("./services/Tasks");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const spreadsheetId = process.env.reportsheetId;
const googlesheet = new GoogleSheet(spreadsheetId);
const taskApi = new Task();

async function generateTasks() {
    await taskApi.initialize();
    const { items: taskListItems } = await taskApi.getTaskLists();
    const sheets = await googlesheet.getSheets();
    for (let sheet of sheets) {
        const sheetTitle = sheet.properties.title;
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

// MAIN FUNCTION
(async () => {
    try {
        await generateTasks();
    } catch (error) {
        console.error(error);
        // setTimeout(async () => {
        //     try {
        //         await generateTasks();
        //     } catch (error) {
        //         setTimeout(async () => {
        //             await generateTasks();
        //         }, 1000 * 60);
        //     }
        // }, 1000 * 60);
    }
})();
