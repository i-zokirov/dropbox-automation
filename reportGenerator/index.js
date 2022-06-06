const ReportClass = require("./ReportClass")

const main = async(req, res) => {
    try {
        const report = new ReportClass()
        await report.initialize()
        await report.run()
        // res.end()
    } catch (error) {
        throw error
    }
}

main()