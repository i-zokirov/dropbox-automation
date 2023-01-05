const axios = require("axios");
const FormData = require("form-data");
class Eskiz {
    constructor(email, password) {
        this.token;
        this.data = new FormData();
        this.data.append("email", email);
        this.data.append("password", password);

        this.baseUrl = `https://notify.eskiz.uz`;
    }

    async authenticate() {
        const { data } = await axios({
            method: "post",
            url: `${this.baseUrl}/api/auth/login`,
            headers: {
                ...this.data.getHeaders(),
            },
            data: this.data,
        });
        this.token = data.data.token;
    }

    async getUserData() {
        const config = {
            method: "get",
            url: `${this.baseUrl}/api/auth/user`,
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        };

        const { data } = await axios(config);
        return data;
    }

    async getDispatchStatus() {
        // const userData = await this.getUserData();
        const formdata = new FormData();
        formdata.append("user_id", 2288);
        formdata.append("start_date", "2023-01-04");
        formdata.append("end_date", "2023-01-05");
        const config = {
            method: "post",
            url: `${this.baseUrl}/api/message/sms/get-user-messages`,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...formdata.getHeaders(),
            },
            data: formdata,
        };
        const { data } = await axios(config);
        return data;
    }

    async getusermessagesbydispatch() {
        const formdata = new FormData();
        formdata.append("user_id", "2288");
        formdata.append("year", "2023");
        const config = {
            method: "post",
            url: `${this.baseUrl}/api/user/totals`,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...formdata.getHeaders(),
            },
            data: formdata,
        };
        const { data } = await axios(config);
        return data;
    }

    async sendSMS(sms) {
        const data = new FormData();
        data.append("mobile_phone", sms.number);
        data.append("message", sms.text);
        data.append("from", "4546");

        const { data: eskizResponseData } = await axios({
            method: "post",
            url: `${this.baseUrl}/api/message/sms/send`,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...data.getHeaders(),
            },
            data,
        });
        return eskizResponseData;
    }

    async sendSMSBatch(messages) {
        const formdata = new FormData();
        formdata.append("from", "4546");
        formdata.append("dispatch_id", "12345678");
        for (let i = 0; i < messages.length; i++) {
            formdata.append(`messages[${i}]`, messages[i]);
        }
        const config = {
            method: "post",
            url: `${this.baseUrl}/api/message/sms/send-batch`,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...formdata.getHeaders(),
            },
            data: formdata,
        };
        const { data } = await axios(config);
        return data;
    }
}

module.exports = Eskiz;
