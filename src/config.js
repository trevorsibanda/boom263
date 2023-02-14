
import {reactLocalStorage} from 'reactjs-localstorage';
 
//check devmode from url
const devMode = window.location.href.indexOf("localhost") > -1

const derivTnc = "https://deriv.com/terms-and-conditions/#clients"
const whatsappURI = "https://wa.me/263737065458?text=Boom263+Help"  
const supportEmail = "support@boom263.co.zw"

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

function localUser() {
    return reactLocalStorage.getObject('user', {
        fullname: 'Guest',
        email: 'anonymous@boom263.co.zw',
        phone: '0000000000',
    })
}

function fetchInnbucksOrders() {
    let t = reactLocalStorage.getObject('innbucks_orders', {orders: []})
    return t.orders.reverse()

}

function saveInnbucksOrder(order) {
    let orders = fetchInnbucksOrders()
    orders.push(order)
    reactLocalStorage.setObject('innbucks_orders', {orders })
}


function setLocalUser(user) {
    reactLocalStorage.setObject('user', user)
}

//calculate package price
function calculate_price(payment_method, price) {
    if (payment_method === 'deriv') {
        return price * 1.1
    }
    if (payment_method === 'innbucks') {
        return price * 1.05
    }
    return price
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
    let order = packages.find(pkg => pkg.id === package_)
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
function verifyAndPay(payment_method, _id, verification_code, email) {
    return api_post("verify_order", {payment_method, _id, verification_code, email})
}

//Checks if server can use given token
function checkDerivToken() {
    
}

function api_url(uri) {
    return (devMode ? "http://localhost:9000/" : "/" ) + ".netlify/functions/index/" + uri
}

function fetchOrder(_id) {
    return api_post("fetch_order", { _id })
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

function createNewOrder(package_, payment_method, quantity = 1) {
    return api_post("new_order", {package_, payment_method, quantity})
}

function derivLoginURL() {
    return "https://oauth.binary.com/oauth2/authorize?app_id=33235"
}

function checkLoggedIn() {
    return derivAuthToken() !== null
}

function clearDerivToken() {
    reactLocalStorage.remove('deriv')
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

function saveStock(stock) {
    return api_post("admin_save_stock", {stock})
}

function adminReport(report) {
    return api_post("admin_report", {report})
}

function stockReport() {
    return adminReport("stock")
}

function filterStock(filter) {
    return api_post("admin_stock", {filter})
}


function removeStock(_id) {
    return api_post("admin_remove_stock", {_id})
}

function editStock(_id, stock) {
    return api_post("admin_edit_stock", {_id, stock})
}

function checkLoggedInRemote() {
    return api_post("check_logged_in", {})
}

function ordersReport() {
    return adminReport("orders")
}

function refundOrder(order) {
    alert("Refund orders not yet implemented")
}

function logout() {
    if (window.confirm("Are you sure you want to logout?")) {
        clearDerivToken()
        reactLocalStorage.clear()
            window.location.reload()
    }
}

const config = {
    packages,
    whatsappURI,
    supportEmail,
    derivTnc,
    admin: {
        filterOrders,
        filterStock,
        saveStock,
        removeStock,
        editStock,
        stockReport,
        ordersReport,
        refundOrder,
        setApiKey: (key) => {
            reactLocalStorage.set('api_key', key)
        },
        getApiKey: () => {
            return reactLocalStorage.get('api_key', '')
        }
    },
    pkg_price: calculate_price,
    pastOrders,
    fetchOrder,
    fetchInnbucksOrders,
    currentOrder,
    saveCurrentOrder,
    saveInnbucksOrder,
    checkLoggedInRemote,
    localUser,
    setLocalUser,
    logout,
    createNewOrder,
    checkLoggedIn,
    verifyAndPay,
    derivAuthToken,
    derivLoginURL,
    getPackage,
    checkDerivToken,
    clearDerivToken,
    storeDerivToken,
    setPostLogin,
    postLogin,
    urlParams,
}

export default config;