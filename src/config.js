
import {reactLocalStorage} from 'reactjs-localstorage';
 

const devMode = true

//available packages for sale
const packages = [
    {
        id: "econet_1usd",
        name: 'Econet US$1.00',
        provider: "Econet",
        amount: 1.00,
        features: [
        <>Econet <b>USD Airtime</b></>,
        <>Instant Recharge</>,
    ]},
    {
        id: "econet_5usd",
        name: 'Econet US$5.00',
        provider: "Econet",
        amount: 5.00,
        features: [
        <>Econet <b>USD Airtime</b></>,
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
    return reactLocalStorage.get('past_orders', [])
}

function currentOrder(checkUrl = false) {
    let u = urlParams()
    if (checkUrl && u.utm_content) {
        let order = packages.filter(pkg => pkg.id === u.utm_content)
        return order
    }
    return reactLocalStorage.getObject('active_order', null)
}

function saveCurrentOrder(order) {
    reactLocalStorage.setObject('active_order', order)
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
function verifyAndPay(id, code, email) {
    let uri =  devMode ? "verify_order.json" : 'verify_order/' + id + '/' + code + '/' + email
    return fetch(api_url(uri)).then(response => {
        saveCurrentOrder({})
        return response.json()
    })
} 

//Checks if server can use given token
function checkDerivToken() {
    
}

function api_url(uri) {
    return (devMode ? "/mock" : "") + '/api/'+uri
}

function fetchOrder(_id) {
   let uri =  devMode ? "fetch_order.json" : 'fetch_order/' + _id
    return fetch(api_url(uri)).then(response => {
        return response.json()
    }) 
}

function createNewOrder(packge, quantity) {
    let uri =  devMode ? "new_order.json" : 'new_order/' + packge + '/' + quantity
    return fetch(api_url(uri)).then(response => {
        saveCurrentOrder({})
        return response.json()
    })
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


const config = {
    packages,
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
    checkDerivToken,
    storeDerivToken,
    setPostLogin,
    postLogin,
    urlParams,
}

export default config;