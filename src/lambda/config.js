const f = require('faunadb')
const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

let appId = 33235
let token = "qWnzrKpq9c1qZlI"// "a1-AQuiTI4RnsDdHAXQlfxtMFcjDyi6z"
let conn = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id='+ appId);
let d        = new DerivAPI({ connection: conn });

const faunaSecret = "fnAE2ADNwvAATFvsToaIMbA5It5zDEQVwhnHq2dg"

const dbClient = new f.Client({secret: faunaSecret})

const ordersCollection = f.Collection("Order")
const stockCollection = f.Collection("Stock")
const stockPackageSearchIndex = f.Index("stockIndex")

function createNewOrder(data) {
    var document = {
    "_id": f.NewId(),
        "package_": data.package_,
        "name": data.name,
        "cr": data.cr,
        "price": data.price * data.quantity,
        "quantity": data.quantity,
        "created": f.Now(),
        "amount": data.amount * data.quantity,
        "status": "pending"
    }

    return dbClient.query(f.Create(ordersCollection, document))
}

function checkStockExists(package_) {
    let query = f.Count(f.Match(stockPackageSearchIndex, package_)) //Map(Paginate(Match(Index("stockIndex"), "econet_usd1")), Lambda("v", Select("data", Get(Var("v")))))
    return dbClient.query(query)
}

function setStockUsed(stockRef) {
    let query = f.Update(stockRef, { data: { status: "used" } })
    return dbClient.query(query)
}



function addNewStock(package_, token, image) {
    var document = {
        "package_": package_,
        "token": token,
        "ussd": "",
        "pretty": "",
        "image": image,
        "status": "ready"
    }
    return dbClient.query(f.Create(stockCollection, document))
}

function retrieveOrder(order_id) {
    return dbClient.query(f.Get(f.Ref(ordersCollection, order_id)))
}

function verifyAndProcessOrder(id, email) {
    d.basic.ping().then(console.log)
    let b = d.basic
    let data = { type: "paymentagent_withdraw", "verify_email": email, 'url_parameters': { "utm_content": id } }
    return b.authorize({ authorize: token }).then(resp => {
        console.log("Authorized for "+ resp)
        return b.verifyEmail(data).catch(console.log)
    })
}

const config = {
    dbClient,
    createNewOrder,
    addNewStock,
    retrieveOrder,
    checkStockExists,
    verifyAndProcessOrder,
}

export default config;