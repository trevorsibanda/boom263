const f = require('faunadb')
const slack = require('@slack/web-api')
const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');
const axios = require('axios')
const paymentMethods = ["deriv", "innbucks"]


const appId = process.env.DERIV_APP_ID
const adminAPIKey = process.env.ADMIN_API_KEY
const faunaSecret = process.env.FAUNA_SECRET
const paymentagent_loginid = process.env.DERIV_PAYMENTAGENT_LOGINID
const slackToken = process.env.SLACK_TOKEN

const salesChannel = process.env.SALES_CHANNEL
const signupsChannel = process.env.SIGNUPS_CHANNEL
const stockChannel = process.env.STOCK_CHANNEL
const activityChannel = process.env.ACTIVITY_CHANNEL

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_TEMPLATE_ID = process.env.SENDGRID_TEMPLATE_ID
const ORDERS_EMAIL = process.env.ORDERS_EMAIL

const dbClient = new f.Client({secret: faunaSecret})

const ordersCollection = f.Collection("Orders")
const userOrdersIdx = f.Index("userOrdersIndex")
const allOrdersIndex = f.Index("allOrdersIndex")
const orderStatusIndex = f.Index("orderStatusIndex")

const stockCollection = f.Collection("Stock")
const stockPackageSearchIndex = f.Index("stockIndex")
const stockAllStatusIndex = f.Index("stockAllStatusIndex")
const stockStatusIndex = f.Index("statusStockIndex")

const innbucksTXCollection = f.Collection("innbucksTx")
const innbucksRefIndex = f.Index("innbucksRefIndex")
const innbucksUserIndex = f.Index("innbucksUserIndex")

const configCollection = f.Collection("Config")
const configKeyIndex = f.Index("configKeyIndex")

const innbucksAccount = process.env.INNBUCKS_ACCOUNT
const innbucksUsername = process.env.INNBUCKS_USERNAME
const innbucksPasscode = process.env.INNBUCKS_PASSCODE
const innbucksAccountName = process.env.INNBUCKS_ACCOUNT_NAME
const innbucksDetails = {
  receiver: innbucksAccount,
  receiver_name: innbucksAccountName,
}
const innbucksLoginURL = "https://gateway.bulkit.co.zw/auth/login"
const innbucksHistoryURL = "https://gateway.bulkit.co.zw/api/transaction/account/3005088255774/miniStatement"

const userLoginIdIndex = f.Index("userLoginIdIndex")
const usersCollection = f.Collection("Users")

const slackClient = new slack.WebClient(slackToken);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);


function lookupLastInnbucksApiToken() {
  let query = f.Get(f.Match(f.Index("configKeyIndex"), "innbucks_api_token"))
  return dbClient.query(query).then(doc => {
    slack_activity("Using innbucks token from database :: " + doc.data.value)
    return doc.data.value
  }).catch(err => {
    slack_activity("No innbucks token in config. Probably expired. Logging in")
    //do http request to innbucks to get token
    return withInnbucksAuth(false)
  })
}

function withInnbucksAuth(retry = true) {
  return innbucksLogin().then(token => {
    //insert if it doesnt exist
    let query = f.Update(f.Match(f.Index("configKeyIndex"), "innbucks_api_token"), {
      data: {
        value: token,
      },
      ttl: f.TimeAdd(f.Now(), 240,  "seconds") 
    })
      return dbClient.query(query).then(doc => {
        return Promise.resolve(token)
      }).catch(_ => {
        return Promise.resolve(token)
      })
  }).catch(err => {
    
    if (retry) {
      console.log("Retrying innbucks auth login")
      return withInnbucksAuth(false)
    } else {
      
      return Promise.reject(err)
      }
    })

}


function innbucksFetchRecentRemoteHistory(token) {
  //sends an http request to innbucksHistoryUrl, parses the response to get the amount, operation, time and then
  // stores this info into the database under the innbucksTx collection checking if the transaction already exists
  // if it does, it ignores the transaction
  // if it doesnt, it inserts the transaction
  

  return axios.get(innbucksHistoryURL, {
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; SM-A516N Build/SP1A.210812.016)"
    }
  }).then(resp => {
    let json = resp.data
    
    let { transactions } = json
    slack_activity("Innbucks history retrieved for account " + (json.accountNumber) +  " with balance: $" + (json.balance/100) + " and " + transactions.length + " transactions")
    slack_activity("Innbucks history response: " + JSON.stringify(transactions))

    //loop over all transactions and insert if it exists
    transactions.forEach(tx => {
      tx.amount = tx.amount/100
      dbClient.query(f.Create(innbucksTXCollection, {
        data: tx
      })).then(_ => {
        console.log("inserted innbucks transaction: " + JSON.stringify(tx))
      }).catch(err => {
        console.log("error inserting innbucks transaction: " + JSON.stringify(err))

      })
    })

    return Promise.resolve(transactions)
  }).catch(err => {
    
    console.log(token, err)
    slack_activity("Innbucks upstream history error: " + JSON.stringify(err))
    return Promise.reject(err)
  })

}


function innbucksLogin() {
  //send an http post to innbucksLoginURL with username and password encoded as a form
  let query = f.Get(f.Match(configKeyIndex, "innbucks_api_token"))
  return dbClient.query(query).then(doc => {
    
    return Promise.resolve(doc.data.value)
  }).catch(err => {
    console.log('innbucks remote login with err : ' + err)
    const form = {
  "username": innbucksUsername,
  "deviceId": "samsungSM-A516N12S166bfbe8-f83b-8950-b794-e8e6e00b549f",
  "pinBlock": innbucksPasscode
  }
  
  let headers= {
      "Content-Type": "application/json",
      "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; SM-A516N Build/SP1A.210812.016)"
  }
  
  return axios.default.post(innbucksLoginURL, form, { headers }).then(res => {
    
    slack_activity("Raw Innbucks login response: " + JSON.stringify(res.data))
    return res.data
  }).then(json => {
    
    if (json.accessToken) {
      //dbClient.query(f.Create(configCollection, {data: {key: "innbucks_api_token", value: json.accessToken}, ttl: f.TimeAdd(f.Now(), 240, "seconds")})).then(console.log).catch(console.log)
      return Promise.resolve(json.accessToken)
    } else {
      
      slack_activity("Innbucks login failed: " + JSON.stringify(json))
      return Promise.reject(json)
    }
  })
  })

}

//available packages for sale
const packages = [
    {
        id: "netone_mogigs",
        name: 'Netone MoGigs US$10.00',
        provider: "Netone",
        amount: 10
    },
    {
        id: "econet_10usd",
        name: 'Econet US$10.00',
        provider: "Econet",
      amount: 10
  }, 
  {
    id: "econet_1usd",
    name: 'Econet US$1.00',
    provider: "Econet",
    amount: 1
    
  },
  {
    id: "econet_5usd",
    name: 'Econet US$5.00',
    provider: "Econet",
    amount: 5
    
  },
  {
    id: "netone_1usd",
    name: 'Netone US$1.00',
    provider: "Netone",
    amount: 1
    
    },
]


function pkg_price(payment_method, a) {
  if (payment_method === "innbucks") {
    return a.toFixed(2) * 1.05
  }
  return a.toFixed(2) * 1.1
}

async function send_order_email(order, stock) {
  
  let msg = {
    to: order.email,
    from: ORDERS_EMAIL,
    subject: "Your order has been processed",
    templateId: SENDGRID_TEMPLATE_ID,
    dynamic_template_data: {
      fullname: order.name,
      package: order.package_._id,
      "pin": stock.token,
      "ussd": stock.ussd,
      cr: order.cr,
      "_id": order._id,
      deriv_id: order.deriv_id,
    }
  }
  sgMail.send(msg).catch(err => {
    console.log("Error sending email: " + JSON.stringify(err) + " " + JSON.stringify(msg))
    slack_activity("Error sending email: " + JSON.stringify(err) + " " + JSON.stringify(msg))
  }).then(console.log)
}

async function slack_msg(channel, text) {
  return await slackClient.chat.postMessage({
    channel: channel,
    text: text
  }).catch(console.log).then(console.log)
}

async function slack_user_msg(user, channel, text) {
  let userMsg = `<@${user.fullname} :: ${user.loginid} :: ${user.email}> ${text}`
  return await slack_msg(channel, userMsg)
}

async function slack_activity(text) {
  return await slack_msg(activityChannel, text)
}

async function slack_activity_user(user, text) {
  let userMsg = `<@${user.fullname} :: ${user.loginid} :: ${user.email}> ${text}`
  return await slack_msg(activityChannel, userMsg)
}

function createNewOrder(user, data) {
  let package_ = packages.find(p => p.id === data.package_.id)
  if (!package_) {
    return Promise.reject("Invalid package")
  }

  var document = {
    data: {
      "_id": "",
      "payment_method": data.payment_method,
      innbucks: innbucksDetails,
      "package_": package_,
      "name": user.fullname,
      "cr": user.loginid,
      "email": user.email,
      "country": user.country,

      "purchaser": user,
      "price":  pkg_price(data.payment_method, package_.amount * (data.quantity || 1)),
      "quantity": data.quantity || 1,
      "created": f.Now(),
      "amount": pkg_price(data.payment_method, package_.amount * (data.quantity || 1)),
      "status": "pending"
    },
    ttl: f.TimeAdd(f.Now(), 6, "hours"), //non fulfilled orders expire after 2 hours 
  }

  return dbClient.query(f.Create(ordersCollection, document)).then(doc => {
    let ddata = doc.data
    ddata._id = doc.ref.id
    let now = new Date().toISOString()
    slack_user_msg(user, salesChannel, `New order: ${data.package_.name} x ${data.quantity} for ${data.price} @ ` + now)
    return ddata
  })
}

function checkStockExists(package_) {
  let query = f.Count(f.Match(stockStatusIndex, package_, "free")) //Map(Paginate(Match(Index("stockIndex"), "econet_usd1")), Lambda("v", Select("data", Get(Var("v")))))
  return dbClient.query(query).then(count => {
    if (count <= 0) {
      slack_msg(stockChannel, 'Out of stock for ' + package_)
    }
    return count
  })
}

function popStock(package_, quantity) {
  let query = f.Map(f.Take(quantity, f.Select(["data"], f.Paginate(f.Match(stockStatusIndex, package_, "free")))), f.Lambda("x", f.Select("data", f.Update(f.Var("x"), {data: {"status": "used"}}))))
  return dbClient.query(query)
}

function setOrderPaid(order, stock, amount) {
  let ttl = f.TimeAdd(f.Now(), 365 * 2, "days") //non fulfilled orders expire after 2 years
  let query = f.Update(f.Ref(ordersCollection, order._id), {ttl,  data: {"status": "paid", "paidAt": f.Now(), "amount_paid": amount, "tokens": stock, "stock_id": stock.ref}})
  return dbClient.query(query)
}

function setInnbucksPaymentUsed(fauna_ref, order_id) {
  let query = f.Update(fauna_ref, { data: { "order_id": order_id, status: 'used' } })
  return dbClient.query(query).then(doc => {
    console.log("Innbucks payment used: " + JSON.stringify(doc.data))
    return doc.data
  })
}

//todo: add remote check so we don't rely on database
function checkInnbucksPayment(order, body, recent_history = [], dont_retry = true) {
  let reference = body.verification_code
  let expected = order.amount
  let order_id = order._id

  let query = f.Get(f.Match(innbucksRefIndex, reference))

  for (var i = 0; i < recent_history.length; i++){
    let entry = recent_history[i]
    if (entry.reference === reference) {
      return processInnbucksPayment({
        data: entry
      }, expected, reference, order_id)
    }
  }
  
  return dbClient.query(query).then(doc => {
    return processInnbucksPayment(doc, expected, reference, order_id)
  }).catch(err => {
    console.log("EEEERRRRRROOOOORRRR" + JSON.stringify(err))
    if (!dont_retry) {
      return withInnbucksAuth(true).then(token => {

        return innbucksFetchRecentRemoteHistory(token).then(history => {
          console.log("Got history "+ JSON.stringify(history))
          return checkInnbucksPayment(order, body, history, true)
        }).catch(console.log)
      }).catch(console.log)  
    } else {
      return Promise.reject({
        error: "Innbucks payment not found",
        reason: "Innbucks payment error: " + JSON.stringify(err)
      })
    }
  })
}

function processInnbucksPayment(doc, expected, reference, order_id) {
  console.log("Innbucks payment check: " + JSON.stringify(doc.data))
    if (doc.data.type !== "Credit") {
      return Promise.reject({
        error: "Given Innbucks reference is not a deposit",
        reason: "Only provide reference for money received."
      })
    }
    if (doc.data.status === 'used') {
      console.log("Innbucks payment already used: " + JSON.stringify(doc.data))
      return Promise.reject({
        error: "Innbucks payment already used",
        reason: "Innbucks payment already used: " + JSON.stringify(doc.data)
      })
    }
    doc.data.amount = parseFloat(doc.data.amount)
    if (doc.data.amount && expected &&  doc.data.amount === expected) {
      console.log("Customer paid " + expected + " for Innbucks " + reference)
      let customer = (doc.data.counterPartyFirstName || "") + " " + (doc.data.counterPartyLastName || "")
      slack_msg(activityChannel, "Customer paid " + expected + " for Innbucks " + reference + " Payer: " + customer)
      
      return setInnbucksPaymentUsed(doc.ref, order_id)
    } else if (doc.data.amount < expected) {
      console.log("Customer underpaid. Expected " + expected + " but got " + doc.data.amount + " for Innbucks " + reference)
      slack_msg(activityChannel, "Customer underpaid. Expected " + expected + " but got " + doc.data.amount + " for Innbucks " + reference)
      return Promise.reject({
        error: "Amount paid is less than expected",
        reason: "Expected " + expected + " but got " + doc.data.amount + " for Innbucks " + reference
      })
    } else if (doc.data.amount > expected) {
      console.log("Customer overpaid. Expected " + expected + " but got " + doc.data.amount + " for Innbucks " + reference)
      slack_msg(activityChannel, "Customer overpaid. Expected " + expected + " but got " + doc.data.amount + " for Innbucks " + reference)
      //not a fatal error
      return doc.data
    } else {
      return Promise.reject({
        error: "Programming error",
        reason: "Innbucks payment: " + JSON.stringify(doc.data) + " does not match expected amount: " + expected + " for order " + order_id + " for Innbucks " + reference
      })
    }
}


function listAllUserOrders(cr) {
  return dbClient.query(f.Select(["data"], f.Map(f.Paginate(f.Match(userOrdersIdx, cr), { size: 1024 }), f.Lambda("v", f.Get(f.Var("v")))))).then(docs => {
      return docs.map(doc => {
        let data = doc.data
        data._id = doc.ref.id
        return data
      }) 
  })
}

function listAllOrders(filter) {
  let today = f.Filter(f.Select(["data"], f.Paginate(f.Match (allOrdersIndex), { size: 1024 })), f.Lambda("v", f.Equals(f.Date(f.Select(["data", "created"], f.Get(f.Var("v")))), f.Date(f.Now()))))
  let recent = f.Filter(f.Select(["data"], f.Paginate(f.Match(allOrdersIndex), { size: 100 })), f.Lambda("v", f.Equals(f.Date(f.Select(["data", "created"], f.Get(f.Var("v")))), f.Date(f.TimeSubtract(f.Now(), 1, "days")))))
  let failed = f.Select(["data"], f.Paginate(f.Match(orderStatusIndex, "failed"), { size: 200 }))
  let paid = f.Select(["data"], f.Paginate(f.Match  (orderStatusIndex, "paid"), { size: 500 }))    
  let pending = f.Select(["data"], f.Paginate(f.Match(orderStatusIndex, "pending"), { size: 500 }))

  let queries = { paid, today, recent, failed, pending }


  if (["paid",  "failed", "pending"].indexOf(filter) === -1) {
    return Promise.reject("Invalid filter")
  } 
  let query = f.Map(queries[filter], f.Lambda("v", f.Select("data", f.Get(f.Var("v")))))
  return dbClient.query(query)
}

function listAllStock(filter) {
  var idx
  if (["free", "used", "all"].indexOf(filter) !== -1) {
    idx = f.Index("stockAllStatusIndex")
  } else {
    idx = stockPackageSearchIndex
  }
  let query = f.Map(f.Select("data", f.Paginate(f.Match(idx, filter), {size: 1000})), f.Lambda("v", f.Get(f.Var("v"))))
  return dbClient.query(query).then(stock => {
    for (var i = 0; i < stock.length; i++){
        let ts = stock[i]
        stock[i] = ts.data
        stock[i]._id = ts.ref.id
    }
    return Promise.resolve(stock)
  })
}

function checkUserExists(loginid) {
  return dbClient.query(f.Count(f.Match(userLoginIdIndex, loginid)))
}

function createUser(user) {
  var document = {
    data: user
  }
  return dbClient.query(f.Create(usersCollection, document)).then(doc => {
    let data = doc.data
    data._id = doc.ref.id
    return data
  })
}

function make_token_ussd(package_, token) {
  let code = "*121*"
  if (package_ === "netone_mogigs") {
    code = "*133*"
  }
  return code + token + "#"
}

function addStock(package_, token, image) {
    var document = {
        "package_": package_,
        "token": token,
        "ussd": make_token_ussd(package_, token),
        "pretty": token,
        "image": image,
        "status": "free"
    }
    return dbClient.query(f.Create(stockCollection, document))
}

//make_pretty_token shows a string with spaces after every 4 characters
function make_pretty_token(token) {
  let pretty = ""
  for (let i = 0; i < token.length; i++) {
    pretty += token[i]
    if ((i + 1) % 4 === 0) {
      pretty += " "
    }
  }
  return pretty
}

function saveStock(stock_list) {
  let stock_items = stock_list.map(stock => {
    return {
        "package_": stock.package_,
        "token": stock.pin,
        "created": f.Now(),
        "amount": stock.package_.amount,
        "ussd": make_token_ussd(stock.package_, stock.pin),
        "pretty": make_pretty_token(stock.pin),
        "image": "/public/images/" + stock.package_ + ".png",
        "status": "free"
    }
  })
  return dbClient.query(f.Foreach(stock_items, f.Lambda("stock", f.Create(stockCollection, { data: f.Var("stock") })))).then(res => {
    return Promise.resolve(stock_list)
  })
}

function removeStock(stock_id) {
  let query = f.Delete(f.Ref(stockCollection, stock_id))
  return dbClient.query(query)
}


function retrieveOrder(order_id) {
  return dbClient.query(f.Get(f.Ref(ordersCollection, order_id))).then(document => {
    document.data._id = document.ref.id
    return Promise.resolve(document.data)
    })
}

function paymentAgentDoWithdraw(order, body, derivBasicAPI, dry_run) {
  let { verification_code } = body
  
  let description = "Boom263 Purchase "
  let currency = 'USD'
  let data = {amount: order.amount, currency, description, dry_run, paymentagent_withdraw: 1, paymentagent_loginid, verification_code}
  console.log("Payment agent processing withdrawal", data)
  return derivBasicAPI.paymentagentWithdraw(data)
}

function paymentAgentInitWithdraw(derivBasicAPI, id, email) {
  let data = { type: "paymentagent_withdraw", "verify_email": email, 'url_parameters': { "utm_content": id } }
  console.log("Sending deriv payment agent withdraw email ", data)
  return derivBasicAPI.verifyEmail(data)
}

function withDerivAuth(req, res, callback) {

  let conn = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id='+ appId);
  let d        = new DerivAPI({ connection: conn });
  let b = d.basic

  console.log('withDerivAuth: ', req.body)
  if (!(req.body && req.body.deriv && req.body.deriv.token)) {
    res.jsonp({
        error: 'Deriv token not passed'
    })
    return
  }
  let token = req.body.deriv.token
  console.log("Authorize with " + token)
  return b.authorize({ authorize: token }).catch(err => {
    console.log("AUTH", err)
    res.jsonp({
      error: "Failed to authenticate user to Deriv"
    })
  }).then(resp => {
    console.log('Deriv auth with', resp)
    req.user = resp.authorize
    console.log('Calling callback')
    return callback(req, res, b)
  })
  

}

function withNoAuth(req, res, callback) {
  req.user = {
    loginid: req.body.phone || "anonymous",
    fullname: "Anonymous",
    email: "anonymous@boom263.co.zw",
    phone: req.body.phone || innbucksAccount
  }
  return callback(req, res)
}

function withAdminAuth(req, res, callback) {
  
  if (req.headers && req.headers['x-api-key'] && req.headers['x-api-key'] === adminAPIKey) {

    return callback(req, res)
  } else {
    res.jsonp({
        error: 'Incorrect admin token passed' + req.headers['x-api-key']
    })
    return
  }
}

let core = {
    withAdminAuth,
    withDerivAuth,
    withInnbucksAuth,
    withNoAuth,
    paymentAgentDoWithdraw,
    paymentAgentInitWithdraw,
    retrieveOrder,
    removeStock,
    saveStock,
    make_pretty_token,
    addStock,
  createUser,
    createNewOrder,
    checkUserExists,
    listAllStock,
    listAllOrders,
    listAllUserOrders,
    lookupLastInnbucksApiToken,
  checkInnbucksPayment,
    innbucksLogin,
    checkStockExists,
    setOrderPaid,
    popStock,
    send_order_email,
    slack_activity,
    slack_activity_user,
    slack_msg,
    slack_user_msg,
    pkg_price,
    

    dbClient,
    sgMail,
    appId,
    slackClient,

  paymentMethods,
  salesChannel,
  signupsChannel,
  activityChannel,
  stockChannel,
    


}

module.exports = core;
