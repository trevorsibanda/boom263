
import {reactLocalStorage} from 'reactjs-localstorage';
 

const devMode = false

//available packages for sale
const packages = [
    {
        id: "netone_mogigs",
        name: 'Netone MoGigs US$10.00',
        provider: "Netone",
        amount: 10, features: [
        <>Netone <b>15Gig Mo Gigs</b></>,
        <>Instant Recharge</>,
    ]},
    {
        id: "econet_10usd",
        name: 'Econet US$10.00',
        provider: "Econet",
        amount: 10, features: [
        <>Econet <b>USD Airtime</b></>,
        <>Instant Recharge</>,
    ]}
]

//calculate package price
function calculate_price(price) {
    return price *  1.1
}

function pastOrders() {
    return api_post('my_orders', {})
}

function currentOrder(checkUrl = false) {
    let u = urlParams()
    if (checkUrl && u.utm_content) {
        let order = packages.filter(pkg => pkg.id === u.utm_content)
        return order
    }
    return reactLocalStorage.getObject('active_order', null)
}

function getPackage(package_) {
    let order = packages.filter(pkg => pkg.id === package_)
    return order
}

function saveCurrentOrder(order) {
    let r = reactLocalStorage.setObject('active_order', order)
    return Promise.resolve(r)
}

function derivAuthToken() {
    return reactLocalStorage.getObject('deriv', null)
}

function storeDerivToken(currency, cr, token) {
    reactLocalStorage.setObject('deriv', {
        currency, cr, token
    })
}

//Send an http request to the server containing the verification code
//retrieved by the user from the Deriv OTP email and an optional
//email address to receive their airtime recharge pin.
function verifyAndPay(_id, verification_code, email) {
    return api_post("verify_order", {_id, verification_code, email})
}

//Checks if server can use given token
function checkDerivToken() {
    
}

function api_url(uri) {
    return (devMode ? "http://localhost:9000/" : "/" ) + ".netlify/functions/index/" + uri
}

function fetchOrder(_id) {
    return api_post("fetch_order", {_id})
}

function api_post(uri, data) {
    let deriv = derivAuthToken()
    return fetch(api_url(uri), {
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': reactLocalStorage.get('api_key', '')
        },
        body: JSON.stringify({ ...data, deriv}),
        }).then(response => {
        return response.json()
    })
}

function createNewOrder(package_, quantity) {
    return api_post("new_order", {package_, quantity})
}

function derivLoginURL() {
    return "https://oauth.binary.com/oauth2/authorize?app_id=33235"
}

function checkLoggedIn() {
    return derivAuthToken() !== null
}

function setPostLogin(uri) {
    reactLocalStorage.set('post_login', uri)
}

function postLogin() {
    return reactLocalStorage.get('post_login', '/')
}

function urlParams() {
   return Object.fromEntries(window.location.search.slice(1).split('&').map(entry => entry.split('=') ))
}

function filterOrders(filter) {
    return api_post("admin_orders", {filter})
}

function adminReport(report) {
    return api_post("admin_report", {report})
}

function stockReport() {
    return adminReport("stock")
}


function ordersReport() {
    return adminReport("orders")
}

function refundOrder(order) {
    alert("Refund orders not yet implemented")
}

const config = {
    packages,
    admin: {
        filterOrders,
        stockReport,
        ordersReport,
        refundOrder,
        setApiKey: (key) => {
            reactLocalStorage.set('api_key', key)
        },
    },
    pkg_price: calculate_price,
    pastOrders,
    fetchOrder,
    currentOrder,
    saveCurrentOrder,
    createNewOrder,
    checkLoggedIn,
    verifyAndPay,
    derivAuthToken,
    derivLoginURL,
    getPackage,
    checkDerivToken,
    storeDerivToken,
    setPostLogin,
    postLogin,
    urlParams,
}

export default config;