const Eskiz = require("./services/Eskiz");
const GoogleSheet = require("./services/GoogleSheet");
const Task = require("./services/Tasks");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const spreadsheetId = process.env.reportsheetId;
const eskiz = new Eskiz(process.env.email, process.env.password);
const googlesheet = new GoogleSheet(spreadsheetId);
const taskApi = new Task();

async function processCompletedTasks() {
    const { items: taskLists } = await taskApi.getTaskLists();
    let smsTaskList = taskLists.find((list) => list.title === "SMS Tasks");
    if (!smsTaskList) {
        smsTaskList = await taskApi.createTaskList("SMS Tasks");
    }

    for (let list of taskLists) {
        console.log(`Processing ${list.title} - ${list.id}`);
        if (list.title === "SMS Tasks") {
            continue;
        }
        const completedTasks = await taskApi.getCompletedTasks(list.id);
        const smsTasks = await taskApi.getTasks(smsTaskList.id);
        if (completedTasks.length)
            for (let task of completedTasks) {
                if (
                    smsTasks.some(
                        (smsTask) =>
                            smsTask.title === `${task.title} => ${list.title}`
                    )
                ) {
                    continue;
                } else {
                    await taskApi.createTask(smsTaskList.id, {
                        title: `${task.title} => ${list.title}`,
                    });
                }
            }
    }
}

async function processSmsTasks() {
    const { items: taskLists } = await taskApi.getTaskLists();
    const smsTaskList = taskLists.find((list) => list.title === "SMS Tasks");
    const openTasks = await taskApi.getOpenTasks(smsTaskList.id);
    const data = await googlesheet.getSheetDataAsObject("Contacts");

    let contacts = {};
    if (data.length) {
        for (let contact of data) {
            contacts[contact["Ismi"]] = contact;
        }
    }

    if (openTasks.length) {
        await eskiz.authenticate();

        for (let task of openTasks) {
            console.log(`PROCESSING ${task.title}`);
            const contactTitle = task.title.split("=>")[1].trim();

            if (contacts[contactTitle]) {
                // construct text
                const rawText = await googlesheet.getRows("SMS Text");
                const textChunks = rawText[1][0].split("$INVOICE");
                // send SMS to client
                const response = await eskiz.sendSMS({
                    number: contacts[contactTitle]["Telefon raqami"],
                    text: `${textChunks[0]} ${task.title.split("=>")[0]} ${
                        textChunks[1]
                    }`,
                });
                console.log(`SMS sent for ${task.title.split("=>")[0]}`);
                const completed = await taskApi.updateTask(
                    task.id,
                    smsTaskList.id,
                    {
                        ...task,
                        notes: `SMS Sent from Eskiz. \n SMS ID: ${response.id}`,
                        status: "completed",
                    }
                );
                console.log(`COMPLETED ${completed.title}`);
            } else {
                const completed = await taskApi.updateTask(
                    task.id,
                    smsTaskList.id,
                    {
                        ...task,
                        notes: `NO CONTACT NUMBER`,
                    }
                );
                console.log(`COMPLETED ${completed.title}`);
            }
        }
    }
}

// MAIN
exports.monitorGoogleTasks = async (req, res) => {
    try {
        await taskApi.initialize();
        await processCompletedTasks();
        await processSmsTasks();
        res.end();
    } catch (error) {
        console.error(error);
        throw new Error("EXECUTION FAILED");
    }
};

// (async function () {
//     try {
//         await taskApi.initialize();
//         await processCompletedTasks();
//         await processSmsTasks();
//         // res.end();
//     } catch (error) {
//         console.error(error);
//         return;
//     }
// })();
