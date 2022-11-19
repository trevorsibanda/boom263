const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

let appId = 33235
let token = "a1-AQuiTI4RnsDdHAXQlfxtMFcjDyi6z"
let conn = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id='+ appId);
let d        = new DerivAPI({ connection: conn });
d.basic.ping().then(console.log)
let b = d.basic
b.authorize({ authorize: "qWnzrKpq9c1qZlI" }).catch(console.log).then(resp => {
    console.log(resp)
    b.verifyEmail({ type: "paymentagent_withdraw", "verify_email": 'trevorsibb@gmail.com', 'url_parameters': { "utm_content": 11 } }).then(console.log).catch(console.log)
})

