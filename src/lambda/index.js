const f = require('faunadb')
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

let appId = 33235

const faunaSecret = "fnAE2ADNwvAATFvsToaIMbA5It5zDEQVwhnHq2dg"

const dbClient = new f.Client({secret: faunaSecret})

const ordersCollection = f.Collection("Orders")
const userOrdersIdx = f.Index("userOrdersIndex")

const stockCollection = f.Collection("Stock")
const stockPackageSearchIndex = f.Index("stockIndex")
const stockAllStatusIndex = f.Index("stockAllStatusIndex")
const stockStatusIndex = f.Index("statusStockIndex")


const paymentagent_loginid = 'CR831650'

const app = express();


function pkg_price(a) {
  return a.toFixed(2) * 1.1
}

function createNewOrder(user, data) {
  var document = {
    data: {
      "_id": "",
      "package_": data.package_,
      "name": data.name,
      "cr": data.cr,
      "email": user.email,
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
    let data = doc.data
    data._id = doc.ref.id
    return data
  })
}

function checkStockExists(package_) {
    let query = f.Count(f.Match(stockPackageSearchIndex, package_)) //Map(Paginate(Match(Index("stockIndex"), "econet_usd1")), Lambda("v", Select("data", Get(Var("v")))))
  return dbClient.query(query)
    
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
  let query = f.Select(["data"], f.Paginate(f.Match(userOrdersIdx, cr), { size: 1024 }))
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

function make_token_ussd(package_, token) {
  let code = "*121*"
  if (package_ === "netone_mogigs") {
    code = "*133*"
  }
  return code + token + "#"
}

function addNewStock(package_, token, image) {
    var document = {
        "package_": package_,
        "token": token,
        "ussd": make_token_ussd(token, ""),
        "pretty": token,
        "image": image,
        "status": "ready"
    }
    return dbClient.query(f.Create(stockCollection, document))
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
  let data = {amount: pkg_price(order.package_.amount), currency, description, dry_run, paymentagent_withdraw: 1, paymentagent_loginid, verification_code}
  console.log("Payment agent processing withdrawal", data)
  return derivBasicAPI.paymentagentWithdraw(data).catch(console.log)
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
  let expectedKey = 'dev-api-key'
  if (req.headers && req.headers['x-api-key'] && req.headers['x-api-key'] !== expectedKey) {
    res.jsonp({
        error: 'Incorrect admin token passed' + req.headers['x-api-key']
    })
    return
  }
  return callback(req, res)
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
    console.log("Fetched order " + document)
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
        res.jsonp({ 
          error: 'Sorry selected item is now out of stock'
        })
      } else {
        return paymentAgentDoWithdraw(derivBasicAPI, order, req.body.verification_code, dry_run).then(resp => {
          if (resp.error && resp.error.code) {
            res.jsonp({
              error: 'Failed to withdraw funds from your Deriv account: ' + resp.error.code,
              reason: resp.error.message
            })
            return Promise.resolve()
          }
          console.log("Withdrawal request for ", + order._id + " success")
          //get one stock item from list
          return popStock(order.package_.id).then(stock => {
            console.log('Popped stock for order ' + order._id + " - " + JSON.stringify(stock))
            return setOrderPaid(order, stock, pkg_price(order.package_.amount)).then(document => {
              console.log("Updated and set order " + order._id + " to paid")
              res.jsonp(document.data)
            }).catch(err => {
              console.log("Fatal error, failed to update order after paid " + order._id)
              res.jsonp({
                error: 'Your order failed at the end, but your recharge pin is ' + stock.data.code,
                reason: stock.data
              })
            })
          }).catch(console.log) 
        }).catch(err => {
          console.log("Failed to process withdrawal request for order " + order._id + "with error: "+ err)
          res.jsonp({
            error: 'Failed to process withdrawal request',
            reason: err
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
    res.jsonp(orders)
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load orders',
      reason: JSON.stringify(err)
    })
  })
}))

router.post('/admin_stock', (req, res) => withAdminAuth(req, res, (req, res) => {
  
  return listAllStock(req.body.filter).then(stock => {
    res.jsonp(stock)
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load stock',
      reason: JSON.stringify(err)
    })
  })
}))

app.use(express.json())
app.use('/.netlify/functions/index', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);