import {createNewOrder, retrieveOrder } from "./config"

let HEADERS = {
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin',
  'Content-Type': 'application/json', //optional
  'Access-Control-Allow-Methods': 'GET, HEADERS, POST, OPTIONS',
  'Access-Control-Max-Age': '8640'
}

//This solves the "No ‘Access-Control-Allow-Origin’ header is present on the requested resource."

HEADERS['Access-Control-Allow-Origin'] = '*'
HEADERS['Vary'] = 'Origin'



exports.handler = async function (event, context) {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: '200', HEADERS }
    }
    if (event.httpMethod === 'POST') {
        const body = JSON.parse(event.body)
        
        const {id} = body
        return retrieveOrder(id).then(document => {
            console.log("Retrieved order ",document)
            document.data._id = document.ref.id
            return {
                statusCode: 200,
                body: document.data,
                HEADERS
            } 
        }).catch(err => {
            return {
                statusCode: 400,
                body: 'Failed to fetch order with reason: ' + JSON.stringify(err),
                HEADERS
            } 
        })
         
    }
    return {
        statusCode: 200,
        body: 'Only POST allowed',
      HEADERS
    }
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      body: e.toString()
    }
  }
}