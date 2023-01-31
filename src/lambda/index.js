const f = require('faunadb')
const slack = require('@slack/web-api')
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

let appId = process.env.DERIV_APP_ID
const adminAPIKey = process.env.ADMIN_API_KEY
const faunaSecret = process.env.FAUNA_SECRET
const paymentagent_loginid = process.env.DERIV_PAYMENTAGENT_LOGINID
const slackToken = process.env.SLACK_TOKEN

const salesChannel = process.env.SALES_CHANNEL
const signupsChannel = process.env.SIGNUPS_CHANNEL
const stockChannel = process.env.STOCK_CHANNEL
const activityChannel = process.env.ACTIVITY_CHANNEL

const dbClient = new f.Client({secret: faunaSecret})

const ordersCollection = f.Collection("Orders")
const userOrdersIdx = f.Index("userOrdersIndex")
const allOrdersIndex = f.Index("allOrdersIndex")
const orderStatusIndex = f.Index("orderStatusIndex")

const stockCollection = f.Collection("Stock")
const stockPackageSearchIndex = f.Index("stockIndex")
const stockAllStatusIndex = f.Index("stockAllStatusIndex")
const stockStatusIndex = f.Index("statusStockIndex")

const userLoginIdIndex = f.Index("userLoginIdIndex")
const usersCollection = f.Collection("Users")

const slackClient = new slack.WebClient(slackToken);

const app = express();


function pkg_price(a) {
  return a.toFixed(2) * 1.1
}

function pkg_price_withdraw(a) {
  return a.toFixed(2) * 1.04
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
  var document = {
    data: {
      "_id": "",
      "package_": data.package_,
      "name": user.fullname,
      "cr": user.loginid,
      "email": user.email,
      "country": user.country,

      "purchaser": user,
      "price":  pkg_price( data.price * data.quantity),
      "quantity": data.quantity,
      "created": f.Now(),
      "amount": data.amount * data.quantity,
      "status": "pending"
    }
    //,TODO: Enable TTL for non fulfilled orders
    //ttl: f.TimeAdd(f.Now(), 6, "hours"), //remove this if 
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
  let query = f.Count(f.Match(stockPackageSearchIndex, package_)) //Map(Paginate(Match(Index("stockIndex"), "econet_usd1")), Lambda("v", Select("data", Get(Var("v")))))
  return dbClient.query(query).then(count => {
    if (count <= 0) {
      slack_msg(stockChannel, 'Out of stock for ' + package_)
    }
    return count
  })
}

function popStock(package_) {
  let query = f.Update(f.Select(["data", 0], f.Paginate(f.Match(stockStatusIndex, package_, "free"))), {data: {"status": "used"}})
  return dbClient.query(query)
}

function setOrderPaid(order, stock, amount) {
  let query = f.Update(f.Ref(ordersCollection, order._id), {data: {"status": "paid", "paidAt": f.Now(), "amount_paid": amount, "token": stock.data, "stock_id": stock.ref}})
  return dbClient.query(query)
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
  let query = f.Map(f.Select("data", f.Paginate(f.Match(idx, filter), {size: 1000})), f.Lambda("v", f.Select("data", f.Get(f.Var("v")))))
  return dbClient.query(query)
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
        "ussd": make_token_ussd(package_.id, token),
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
        "package_": stock.package_.id,
        "token": stock.pin,
        "created": f.Now(),
      "amount": stock.package_.amount,
        
        "ussd": make_token_ussd(stock.package_.id, stock.pin),
        "pretty": make_pretty_token(stock.pin),
        "image": "/public/images/" + stock.package_.id + ".png",
        "status": "free"
    }
  })
  return dbClient.query(f.Foreach(stock_items, f.Lambda("stock", f.Create(stockCollection, { data: f.Var("stock") })))).then(res => {
    return Promise.resolve(stock_list)
  })
}

function retrieveOrder(order_id) {
  return dbClient.query(f.Get(f.Ref(ordersCollection, order_id))).then(document => {
    document.data._id = document.ref.id
    return Promise.resolve(document.data)
    })
}

function paymentAgentDoWithdraw(derivBasicAPI, order, verification_code, dry_run = 1) {
  let id = "".replace("_", " ")
  let description = "Purchase " + id + " from Boom263"
  let currency = 'USD'
  let data = {amount: pkg_price_withdraw(order.package_.amount), currency, description, dry_run, paymentagent_withdraw: 1, paymentagent_loginid, verification_code}
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
  b.authorize({ authorize: token }).catch(err => {
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

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});

router.post('/new_order', (req, res) => withDerivAuth(req, res, (req, res, derivBasicAPI) => {
  let body = req.body
  //check if stock exists first
  return checkStockExists(body.package_.id).then(count => {
    if (count === 0) {
      slack_user_msg(req.user, salesChannel, "Failed to create order for " + body.package_.name + " because we are out of stock")
      res.jsonp({
        error: 'Sorry, we are now out of stock for ' + body.package_.name
      })
      return
    }
    return createNewOrder(req.user, body).then(document => {
      console.log("Created new order ", document)
      //document.data._id = document.ref.id
      return paymentAgentInitWithdraw(derivBasicAPI, document._id, req.user.email).then(dr => {
        console.log("Created deriv payment agent withdrawal request")
        res.jsonp(document)
      }).catch(err => {
        res.jsonp({
          error: 'Created order, but failed to send a withdrawal request to your Deriv account',
          reason: { err }
        })
      })
        
    }).catch(err => {
      res.json({
        error: "Failed to create new order",
        reason: JSON.stringify(err),
      })
    })
  }).catch(err => {
    res.json({
      error: "Failed to check stock",
      reason: JSON.stringify(err),
    })
  })
}))

router.post('/fetch_order', (req, res) => {
  return retrieveOrder(req.body._id).then(document => {
    slack_activity("Fetch order " + req.body._id)
    res.jsonp(document)
  }).catch(err => {

          res.json({
            error: "Failed to retrieve order",
            reason: JSON.stringify(err),
            })
        })
})

router.post('/verify_order', (req, res) => withDerivAuth(req, res, (req, res, derivBasicAPI) => {
  console.log(req.body)
  return retrieveOrder(req.body._id).then(order => {
    //check if we have stock
    let dry_run = 0
    console.log("Checking stock for " + order.package_.id)
    return checkStockExists(order.package_.id).then(count => {
      console.log("Stock count for " + order.package_.id + " is " + count)
      if (count === 0) {
        
        slack_user_msg(req.user, salesChannel, "Failed to verify order for " + order.package_.name + " because we are out of stock")
        res.jsonp({ 
          error: 'Sorry selected item is now out of stock'
        })
        return Promise.resolve()
      } else {
        if (count < 10) {
          slack_msg(stockChannel, 'Low stock for ' + order.package_.name + " - " + count + " left")
        }

        return paymentAgentDoWithdraw(derivBasicAPI, order, req.body.verification_code, dry_run).then(resp => {

          if (resp && resp.error && resp.error.code) {
            res.jsonp({
              error: 'Failed to withdraw funds from your Deriv account: ' + resp.error.code,
              reason: resp.error.message
            })
            return Promise.resolve()
          } 
          slack_msg(salesChannel, "Withdrawal request for " + order._id + " success. " + JSON.stringify(resp))
          console.log("Withdrawal request for ", + order._id + " success")
          //get one stock item from list
          return popStock(order.package_.id).then(stock => {
            console.log('Popped stock for order ' + order._id + " - " + JSON.stringify(stock))
            return setOrderPaid(order, stock, pkg_price(order.package_.amount)).then(document => {
              console.log("Updated and set order " + order._id + " to paid")
              slack_user_msg(req.user, salesChannel, "Order " +  order._id + " for " + order.package_.name + " is now paid. Recharge token is " + stock.pretty)
              res.jsonp(document.data)
            }).catch(err => {
              console.log("Fatal error, failed to update order after paid " + order._id)
              
              slack_msg(salesChannel, "SETOrderPaid ::: Failed to update order after paid " + order._id + " with error: " + err)
              slack_msg(salesChannel, "CRITICAL: Contact buyer and find way to resolve issue " + JSON.stringify(stock) + "\n" + JSON.stringify(order))
              res.jsonp({
                error: 'Your order failed at the end, but your recharge pin is ' + stock.data.code,
                reason: stock.data
              })
            })
          }).catch(err => {
            
            slack_msg(salesChannel, "Failed to pop stock from list for order " + order._id + " with error: " + err)
            slack_msg(salesChannel, "CRITICAL: Contact buyer and find way to resolve issue as payment went through " + JSON.stringify(order))
            res.jsonp({
              error: 'Failed to pop stock from list',
              reason: err
            })
          }) 
        }).catch(err => {
          if (err.error && err.error.code) {
            
            slack_user_msg(req.user, salesChannel, "Failed to verify order for " + order.package_.name + " because of error: " + err.error.code + " - " + err.error.message)
            res.jsonp({
              error: 'Failed to withdraw funds from your Deriv account: ' + err.error.code,
              reason: err.error.message
            })
            return Promise.resolve()
          }

          res.jsonp({
            error: 'Failed to process withdrawal request. ',
            reason: (err && err.error && err.error.message ? err.error.message : 'Something went wrong')
          })
        })
      }
    }).catch(err => {
      res.json({
        error: 'Failed to check stock',
        reason: err
      })
    })
  }).catch(err => {
          res.json({
            error: "Failed to retrieve order",
            reason: JSON.stringify(err),
            })
        })
}))

router.post('/my_orders', (req, res) => withDerivAuth(req, res, (req, res, derivBasicAPI) => {
  return listAllUserOrders(req.body.deriv.cr).then(orders => {
    slack_activity_user(req.user, "Fetched and got " + orders.length + " orders")
    let orders_ = orders || []
    res.jsonp(orders_.reverse())
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load orders',
      reason: JSON.stringify(err)
    })
  })
}))

router.post('/check_logged_in', (req, res) => withDerivAuth(req, res, (req, res, derivBasicAPI) => {
  //check if user exists
  return checkUserExists(req.user.loginid).then(count => {
    if (count >= 1) {
      slack_user_msg(req.user, signupsChannel, "User logged in or active session")
    } else {
      slack_user_msg(req.user, signupsChannel, "New user logged in" + JSON.stringify(req.user))
      createUser(req.user)
    }
    res.jsonp({ ok: true })
  }).catch(err => {
    res.jsonp({
      error: 'Failed to check user',
      reason: JSON.stringify(err)
    })
  })

}))

router.post('/admin_stock', (req, res) => withAdminAuth(req, res, (req, res) => {
  
  return listAllStock(req.body.filter).then(stock => {
    slack_activity('Admin loaded stock with filter ' + JSON.stringify(req.body.filter) + ' and got ' + stock.length + ' results')
    let rstock = stock || []

    res.jsonp(rstock.reverse())
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load stock',
      reason: JSON.stringify(err)
    })
  })
}))

router.post('/admin_save_stock', (req, res) => withAdminAuth(req, res, (req, res) => {
  return saveStock(req.body.stock).then(stock => {
    let stocksMsg = stock.map(s => 'PKG: '+ s.package_ + ' - ' + s.pretty).join('\n')
    slack_msg(stockChannel, 'NEW stock added: ' + stocksMsg )
    res.jsonp(stock)
  }).catch(err => {
    res.jsonp({
      error: 'Failed to save stock',
      reason: JSON.stringify(err)
    })
  })

}))

router.post('/admin_orders', (req, res) => withAdminAuth(req, res, (req, res) => {
  
  return listAllOrders(req.body.filter).then(orders => {
    slack_activity('Retrieved orders: ' + JSON.stringify(req.body.filter))
    let rorders = orders || []
    res.jsonp(rorders.reverse())
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load orders',
      reason: JSON.stringify(err)
    })
  })
}))

app.use(express.json())
app.use('/.netlify/functions/index', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);