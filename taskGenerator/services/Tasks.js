const { google } = require("googleapis");
const SecretManager = require("./SecretManager");

const credentials = require("../keys/oauth-credentials.json");
class Task {
    constructor() {
        const { client_secret, client_id, redirect_uris } = credentials.web;

        this.secretManager = new SecretManager();
        this.oauthClient = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[1]
        );

        this.auth;
        this.taskapi;
    }

    async initialize() {
        this.auth = await this.getAuthClient();
        this.taskapi = google.tasks({ version: "v1", auth: this.auth });
    }

    async getAuthClient() {
        const token = await this.secretManager.getToken("google-task-token");
        this.oauthClient.setCredentials(JSON.parse(token));
        return this.oauthClient;
    }

    async getTaskLists() {
        const { data } = await this.taskapi.tasklists.list();
        return data;
    }

    async createTaskList(title) {
        const { data } = await this.taskapi.tasklists.insert({
            requestBody: { title },
        });
        return data;
    }

    async getTasks(taskListId) {
        let taskList = [];
        const result = await this.taskapi.tasks.list({
            tasklist: taskListId,
            showHidden: true,
            showCompleted: true,
            maxResults: 100,
        });
        taskList = [...result.data.items];
        if (result.data.nextPageToken) {
            const { data: data2 } = await this.taskapi.tasks.list({
                tasklist: taskListId,
                showHidden: true,
                showCompleted: true,
                maxResults: 100,
                pageToken: result.data.nextPageToken,
            });
            taskList = [...taskList, ...data2.items];

            if (data2.nextPageToken) {
                const { data: data3 } = await this.taskapi.tasks.list({
                    tasklist: taskListId,
                    showHidden: true,
                    showCompleted: true,
                    maxResults: 100,
                    pageToken: data2.nextPageToken,
                });

                taskList = [...taskList, ...data3.items];

                if (data3.nextPageToken) {
                    const { data: data4 } = await this.taskapi.tasks.list({
                        tasklist: taskListId,
                        showHidden: true,
                        showCompleted: true,
                        maxResults: 100,
                        pageToken: data3.nextPageToken,
                    });
                    taskList = [...taskList, ...data4.items];

                    if (data4.nextPageToken) {
                        const { data: data5 } = await this.taskapi.tasks.list({
                            tasklist: taskListId,
                            showHidden: true,
                            showCompleted: true,
                            maxResults: 100,
                            pageToken: data4.nextPageToken,
                        });
                        taskList = [...taskList, ...data5.items];
                    }
                }
            }
        }
        return taskList;
    }

    async createTask(taskListId, body) {
        const { data } = await this.taskapi.tasks.insert({
            tasklist: taskListId,
            requestBody: { ...body },
        });
        return data;
    }

    async getCompletedTasks(taskListId) {
        const data = await this.getTasks(taskListId);
        return data.filter((item) => item.status === "completed");
    }

    async getTaskAsObject(taskListId) {
        const tasks = await this.getTasks(taskListId);
        let object = {};
        for (let task of tasks) {
            object[task.title] = task;
        }
        console.log(Object.entries(object).length);
        return object;
    }
}

module.exports = Task;
