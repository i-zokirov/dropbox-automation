const ReportClass = require("./ReportClass");

exports.generateReport = async (req, res) => {
    try {
        const report = new ReportClass();
        await report.initialize();
        await report.run();
        res.end();
    } catch (error) {
        throw error;
    }
};
