
const express = require('express');
const path = require('path');
const core = require('./core')

const serverless = require('serverless-http');

const router = express.Router();
const app = express();

router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});

router.post('/new_order', (req, res) => {
  let body = req.body
  let quantity = parseInt(body.quantity)
  body.quantity = quantity
  //check if stock exists first
  return core.checkStockExists(body.package_.id, quantity).then(count => {
    if (count === 0) {
      core.slack_user_msg(req.user, core.salesChannel, "Failed to create order for " + body.package_.name + " because we are out of stock")
      res.jsonp({
        error: 'Sorry, we are now out of stock for ' + body.package_.name
      })
      return
    }
    if (count <= quantity) {
      core.slack_user_msg(req.user, core.salesChannel, "Failed to create order for " + body.package_.name + " because not enough stock" + quantity)
      res.jsonp({
        error: 'Sorry, we only have ' + count + " stock left for " + body.package_.name
      })
      return
    }
    if (!core.paymentMethods.includes(body.payment_method)) {
      res.jsonp({ error: 'Invalid payment method', reason: body.payment_method })
      return
    }
    

    let auth = null
    switch (body.payment_method) {
      case 'deriv':
        auth = core.withDerivAuth
        break
      case 'innbucks':
        auth = core.withNoAuth
        break;
      default:
        res.jsonp({ error: 'Invalid payment method', reason: body.payment_method })
        return
    }

    return auth(req, res, (req, res, derivBasicAPI) => {
      return core.createNewOrder(req.user, body).then(document => {
        console.log("Created new order ", document)
        //document.data._id = document.ref.id
        if (body.payment_method === 'innbucks') {
          res.jsonp(document)
          return
        } 
        return core.paymentAgentInitWithdraw(derivBasicAPI, document._id, req.user.email).then(dr => {
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
        error: "Failed to create order",
        reason: JSON.stringify(err),
      })
    })
    }).catch(err => {
      res.json({
        error: "Failed to check stock",
        reason: JSON.stringify(err),
      })
    })
  })
})

router.post('/fetch_order', (req, res) => {
  return core.retrieveOrder(req.body._id).then(document => {
    core.slack_activity("Fetch order " + req.body._id)
    res.jsonp(document)
  }).catch(err => {

          res.json({
            error: "Failed to retrieve order",
            reason: JSON.stringify(err),
            })
        })
})




router.post('/verify_order', (req, res) => {

  return core.retrieveOrder(req.body._id).then(order => {
      
    if (order.status !== 'pending') {
      res.jsonp({
        error: 'Order is not pending'
      })
      return
    }

    let auth = null
    switch (req.body.payment_method) {
      case 'deriv':
        auth = core.withDerivAuth
        break
      case 'innbucks':
        auth = core.withNoAuth
        break;
      default:
        res.jsonp({ error: 'Invalid payment method', reason: req.body.payment_method })
        return
    }
    //check if we have stock
    let dry_run = 0
    console.log("Checking stock for " + order.package_.id)
    return auth(req, res, (req, res, derivBasicAPI) => {
      return core.checkStockExists(order.package_.id).then(count => {
        console.log("Stock count for " + order.package_.id + " is " + count)
        if (count === 0) {
      
          core.slack_user_msg(req.user, core.salesChannel, "Failed to verify order for " + order.package_.name + " because we are out of stock")
          res.jsonp({
            error: 'Sorry selected item is now out of stock'
          })
          return Promise.resolve()
        } else {
          if (count < 10) {
            core.slack_msg(core.stockChannel, 'Low stock for ' + order.package_.name + " - " + count + " left")
          }

          if (count < order.quantity) {
            res.jsonp({
            error: 'Sorry only ' + count + ' items of ' + order.package_.name + ' are left in stock. Please create a new order for at most '+ count + ' items'
            })
            return Promise.resolve()
          }

          let payFunction = null
          switch (order.payment_method) {
            case 'innbucks':
              payFunction = core.checkInnbucksPayment
              break;
            default:
              payFunction = core.paymentAgentDoWithdraw
              break;
          }
          return payFunction(order, req.body, derivBasicAPI, dry_run).then(resp => {

            if (!resp ) {
              res.jsonp({
                error: 'Failed to verify payment',
                reason: 'No response from payment agent'
              })
              return Promise.resolve()
            } else if (resp && resp.error) {
              res.jsonp({
                error: 'Failed to verify payment',
                reason: resp.error
              })
              return Promise.resolve()
            }

            switch (order.payment_method) {
          
              case 'innbucks':
                core.slack_msg(core.salesChannel, "Innbucks payment for " + order._id + " success. " + JSON.stringify(resp))
                console.log("Innbucks payment for ", + order._id + " success")

                break;
              default:

                if (resp && resp.error && resp.error.code) {
                  res.jsonp({
                    error: 'Failed to withdraw funds from your Deriv account: ' + resp.error.code,
                    reason: resp.error.message
                  })
                  return Promise.resolve()
                }
                core.slack_msg(core.salesChannel, "Withdrawal request for " + order._id + " success. " + JSON.stringify(resp))
                console.log("Withdrawal request for ", + order._id + " success")
            
                break;

            }
            
            //get one stock item from list
            return core.popStock(order.package_.id, order.quantity).then(stock => {
              console.log(stock)
              if (stock.length !== order.quantity) {
                core.slack_activity("WARNING: User received less stock than he/she paid for " + JSON.stringify(order) + "\n" + JSON.stringify(stock))
              }
              console.log('Popped stock for order ' + order._id + " - " + JSON.stringify(stock))
              return core.setOrderPaid(order, stock, order.amount).then(document => {
                core.send_order_email(order, stock)
                console.log("Updated and set order " + order._id + " to paid")
                core.slack_user_msg(req.user, core.salesChannel, "Order " + order._id + " for " + order.package_.name + " is now paid. Recharge token is " + stock.pretty)
                res.jsonp(document.data)
              }).catch(err => {
                console.log("Fatal error, failed to update order after paid " + order._id)
                
                core.slack_msg(core.salesChannel, "SETOrderPaid ::: Failed to update order after paid " + order._id + " with error: " + err)
                core.slack_msg(core.salesChannel, "CRITICAL: Contact buyer and find way to resolve issue " + JSON.stringify(stock) + "\n" + JSON.stringify(order))
                res.jsonp({
                  error: 'Your order failed at the end, but your recharge pin is ' + stock[0].data.code,
                  reason: stock
                })
              })
            }).catch(err => {
              console.log(err)
              core.slack_msg(core.salesChannel, "Failed to pop stock from list for order " + order._id + " with error: " + err)
              core.slack_msg(core.salesChannel, "CRITICAL: Contact buyer and find way to resolve issue as payment went through " + JSON.stringify(order))
              
              core.setOrderPaid(order, [], order.amount).then(doc => {
                res.jsonp({
                order: doc.data,
                error: 'Payment received but failed to pull stock from inventory, contact support',
                reason: 'Failed to access stock. Contact support'
                })
                return
              }).catch(err => {
                console.log("Fatal error, failed to update order after paid " + order._id)
                
                core.slack_msg(core.salesChannel, "SETOrderPaid ::: Failed to update order after paid " + order._id + " with error: " + err)
                res.jsonp({
                  error: 'Your order failed at the end, your payment was received. Please contact support to get your recharge token' ,
                  reason: []
                })
              })
            })
          }).catch(err => {
            core.slack_user_msg(req.user, core.salesChannel, "Failed to verify order for " + order.package_.name + " because of error: " + err)
          
            switch (order.payment_method) {
              case 'innbucks':
                res.jsonp(err)
                return
                break;
              default:
                if (err && err.error && err.error.code) {
                  res.jsonp({
                    error: 'Failed to withdraw funds from your Deriv account: ' + err.error.code,
                    reason: err.error.message
                  })
                  return
                }
                
                break;
              
            }
            res.jsonp({
              error: 'Failed to process payment. ',
              reason: (err && err.error && err.error.message ? err.error.message : 'Something went wrong')
            })
              
          })

        }
      }).catch(err => {
        console.log("Failed to check stock for order " + order._id + " with error: " + err)
        res.json({
          error: 'Failed to check stock',
          reason: err
        })
      })
    })


  }).catch(err => {
          res.json({
            error: "Failed to retrieve order",
            reason: JSON.stringify(err),
            })
  })

})

router.post('/my_orders', (req, res) => core.withNoAuth(req, res, (req, res, derivBasicAPI) => {
  return core.listAllUserOrders(req.body.deriv.cr).then(orders => {
    core.slack_activity_user(req.user, "Fetched and got " + orders.length + " orders")
    let orders_ = orders || []
    res.jsonp(orders_.reverse())
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load orders',
      reason: JSON.stringify(err)
    })
  })
}))

router.post('/check_logged_in', (req, res) => core.withDerivAuth(req, res, (req, res, derivBasicAPI) => {
  //check if user exists
  return core.checkUserExists(req.user.loginid).then(count => {
    if (count >= 1) {
      core.slack_user_msg(req.user, core.signupsChannel, "User logged in or active session")
    } else {
      core.slack_user_msg(req.user, core.signupsChannel, "New user logged in" + JSON.stringify(req.user))
      core.createUser(req.user)
    }
    res.jsonp({ ok: true })
  }).catch(err => {
    res.jsonp({
      error: 'Failed to check user',
      reason: JSON.stringify(err)
    })
  })

}))

router.post('/admin_stock', (req, res) => core.withAdminAuth(req, res, (req, res) => {
  
  return core.listAllStock(req.body.filter).then(stock => {
    core.slack_activity('Admin loaded stock with filter ' + JSON.stringify(req.body.filter) + ' and got ' + stock.length + ' results')
    let rstock = stock || []

    res.jsonp(rstock.reverse())
  }).catch(err => {
    res.jsonp({
      error: 'Failed to load stock',
      reason: JSON.stringify(err)
    })
  })
}))

router.post('/admin_save_stock', (req, res) => core.withAdminAuth(req, res, (req, res) => {
  return core.saveStock(req.body.stock).then(stock => {
    let stocksMsg = stock.map(s => 'PKG: '+ JSON.stringify(s)).join('\n')
    core.slack_msg(core.stockChannel, 'NEW stock added: ' + stocksMsg )
    res.jsonp(stock)
  }).catch(err => {
    res.jsonp({
      error: 'Failed to save stock',
      reason: JSON.stringify(err)
    })
  })

}))

router.post('/admin_remove_stock', (req, res) => core.withAdminAuth(req, res, (req, res) => {
  return core.removeStock(req.body._id).then(stock => {
    core.slack_msg(core.stockChannel, 'Deleted stock: ' + JSON.stringify(stock) )
    res.jsonp({ stock, status: 'ok' })
  }).catch(err => {
    res.jsonp({
      error: 'Failed to remove stock',
      reason: JSON.stringify(err)
    })
  })

}))

router.post('/admin_orders', (req, res) => core.withAdminAuth(req, res, (req, res) => {
  
  return core.listAllOrders(req.body.filter).then(orders => {
    core.slack_activity('Retrieved orders: ' + JSON.stringify(req.body.filter))
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