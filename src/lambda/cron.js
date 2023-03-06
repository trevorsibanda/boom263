
import { schedule } from "@netlify/functions";
const core = require('./core')

const fetchPaymentsHandler = async (event, context) => {
    console.log("Received event:", event);
    core.slack_activity("cron, checking innbucks payment")
    await core.withInnbucksAuth(true).then(token => {
        return core.innbucksFetchRecentRemoteHistory(token).then(history => {
            console.log("Cron Got Innbucks history " + JSON.stringify(history))
            core.slack_activity("Fetched and got history : " + JSON.stringify(history))
          
        }).catch(console.log)
      }).catch(console.log)

    return {
        statusCode: 200,
    };
};

const handler = schedule("*/10 * * * *", fetchPaymentsHandler)

export { handler };