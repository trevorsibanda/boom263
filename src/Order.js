import { Component, useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import config from "./config"
import Loader from "./Loader"
import withRouter from "./withRouter"


function OrderFailure(props) {
  let order = props.order
  console.log(props.order)
    return (
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

              <h2 className="text-danger"><span>{props.error && props.error.error ? props.error.error : "An error occured"}</span> </h2>
              <h4><span>Hi {order && order.purchaser ? order.purchaser.fullname : "there"},</span> </h4>
                                <p>The action failed with error: 
                                    
              </p>

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i><b>REASON FAILED</b>: <pre>{ props.error && props.error.reason ? props.error.reason : JSON.stringify(props.error)}</pre></li>
                <li><i className="vi bi-chevron-right"></i><b>OrderID</b> {order && order._id ? order._id : "--"}</li>
                <li><i className="vi bi-chevron-right"></i><b>Package</b> {order && order.package_ ? order.package_.id : (order.id ? order.id : "NIL")}</li>
                {props.pmethod ?
                  <li><i className="vi bi-chevron-right"></i><b>Payment Method</b> {props.pmethod}</li> : null}
                <li><i className="vi bi-chevron-right"></i><b>Amount</b> {order && order.amount ? order.amount  : "???"}</li>
                <li><a href={config.whatsappURI} className="btn btn-danger btn-block" ><i className="vi bi-support"></i>Need help, talk to us on Whatsapp</a></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}

function OrderSuccess(props) {
    let { order } = props
    let {token} = order
    return (
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

              <h2><span>Payment received</span> </h2>
            <h4><span>Successfully bought {order.package_.name}</span> </h4>
              <p>Thank you for using Boom263, find your order below.</p>
              <div className="block-pricing">
              <div className="pricing-table">
                <ul className="list-unstyled">
                        <li>
                            <img src="/assets/img/cards.png" alt="card type" style={{width: "100%"}} />
                        </li>
                </ul>
                <h4>Recharge PIN</h4>
                <h2><code>{token.pretty}</code></h2>
                <div className="row">
                    <div className="col-md-12">
                        Click the button below to copy the recharge code to your clipboard.
                    </div>
                    <div className="col-md-12">
                        <button className="btn btn-info btn-block">{token.ussd}</button>
                    </div>
                  </div>
                
                <div className="table_btn">
                    <Link to={"/buy/"+order.package_.id} className="btn btn-default"><i className="bi bi-cart"></i> Buy this again</Link>
                </div>
              </div>
            </div>

               
              <ul className="list-unstyled"> 
                <li><i className="vi bi-chevron-right"></i>Order ID: <b>{order._id}</b></li>
                <li><i className="vi bi-chevron-right"></i>Buyer account: <b>{order.purchaser.fullname}</b></li>
                <li><i className="vi bi-chevron-right"></i>Amount Paid: <b>USD${order.amount_paid}</b></li>
                <li><i className="vi bi-chevron-right"></i>Time Paid: <b>{order.paidAt ? order.paidAt["@ts"] : "recently"}</b></li>
                    <li>Need help? <a href={config.whatsappURI} target="_blank" rel="noreferrer">Talk to our customer support on Whatsapp</a></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}

function OrderPendingInnbucks(props) {
  let [order, setOrder] = useState(props.order)
   
    let [wait, setWait] = useState(60)
    let [code, setCode] = useState("")
    let [disabled, setDisabled] = useState(true)
    let [inputDisabled, setInputDisabled] = useState(true)
    let [paid, setPaid] = useState(false)
    let [working, setWorking] = useState(false)
  let [error, setError] = useState(false)

  let [timer, setTimer] = useState(null)
  setTimer(setInterval(() => {
    setWait(wait - 1)
  }, 1000))
  
  
  let verifyAndPay = () => {

        if (code.length <= 4) {
            return alert('Verification code needed', "Please enter a valid verification code sent to your Deriv email address")
        }

        setWorking(true)
        setDisabled(true)
        setInputDisabled(true)


    config.verifyAndPay(order._id, code).then(updatedOrder => {
          
          if (updatedOrder && updatedOrder.error) {
            setError(updatedOrder)
            setWorking(false)
            setDisabled(false)
            setInputDisabled(false)
            clearInterval(timer)
            return
          }
                setOrder(updatedOrder)
                setWorking(false)
                setDisabled(false)
                setInputDisabled(false)
                if (updatedOrder.status === "paid") {
                    setPaid(true)
                } else {
                  setWait(60)
                } 
        }).catch(err => {
                clearInterval(timer)
                setError(err)
                setWorking(false)
                setDisabled(false)
                setInputDisabled(false)
                alert('Error', 'Failed to process your order with error: '+ JSON.stringify(err), 'warning')
            })

  }
  

  return (working ? <Loader text="Checking payment and completing order" /> :
    (error ? <OrderFailure order={order} error={error} /> :
      (paid ? <OrderSuccess order={order} /> : 
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

            <h2><span>Send Innbucks payment</span></h2> 
            <h4><span>Hi {order.purchaser.fullname},</span> </h4>
                    <p>Please send exactly <strong>{order.amount}</strong> to the number shown below. 
                      <br /> After sending please copy the transaction ID and paste it in the box below.
                      <br /> After successfully doing this, please wait 45 seconds then click the button below to verify your payment.
                      <br /> If you need any help, please contact our customer support on Whatsapp.
                    </p>
              <br />This will complete your airtime purchase.
  
              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i>* InnBucks Number to send to.</li>
                <li><input type="text" readOnly={true} value={order.innbucks.receiver} className="form-control" placeholder="Account number to send to" /></li>
                <li><i className="vi bi-chevron-right"></i>* Innbucks Receiver name.</li>
                <li><input type="text" readOnly={true} value={order.innbucks.receiver_name} className="form-control" placeholder="Innbucks account name" /></li>
              
                <li><i className="vi bi-chevron-right"></i><b>Enter InnBucks Reference code below.</b></li>
                <li><input type="text" readOnly={inputDisabled} value={code} onChange={evt => setCode(evt.target.value)} className="form-control" placeholder="InnBucks reference code" /></li>
              </ul>
              <div className="row">
                <div className="col-md-12">
                        {wait < 1 ?
                          <button onClick={verifyAndPay} disabled={disabled} className="btn btn-block btn-lg btn-danger">Check for Innbucks payment </button> :
                          <button onClick={_ => alert('Please wait', 'You can recheck the payment after ' + wait + ' seconds')} className="btn btn-block btn-lg btn-warning">Wait {wait} seconds before you can check payment.</button>
                        }
                </div>  
              </div> 
              <ul className="list-unstyled"> 
                <li><i className="vi bi-chevron-right"></i><b>Failure to send exactly {config.pkg_price(order.package_.amount)} will result in up to 24 hours delay in getting a refund - At your own expense.</b></li>
                <li><a href={config.whatsappURI} className="btn btn-danger btn-block" ><i className="vi bi-support"></i>Need help, talk to us on Whatsapp</a></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )))
  

}

function OrderPendingDeriv(props) {
    let [order, setOrder] = useState(props.order)
   
    let [email, setEmail] = useState("")
    let [code, setCode] = useState("")
    let [disabled, setDisabled] = useState(true)
    let [inputDisabled, setInputDisabled] = useState(true)
    let [confirmMsg, setConfirmMsg] = useState(false)
    let [paid, setPaid] = useState(false)
  let [working, setWorking] = useState(false)
  let [error, setError] = useState(false)

  useEffect(() => {
        setEmail("")
        let params = config.urlParams()
        if (params && params.code && !working) {
            setCode(params.code)
            setInputDisabled(true)
            setDisabled(false)
            setConfirmMsg(true)
            setWorking(false)
            
        } else {
            setInputDisabled(true)
            setDisabled(true)
        
        }

    }, [setCode, setDisabled, setWorking, email, working, setEmail, code, order._id, setInputDisabled])

    let verifyAndPay = () => {

        if (code.length <= 4) {
            return alert('Verification code needed', "Please enter a valid verification code sent to your Deriv email address")
        }

        setWorking(true)
        setDisabled(true)
        setInputDisabled(true)


        config.verifyAndPay(order._id, code, email).then(updatedOrder => {
          if (updatedOrder && updatedOrder.error) {
            setError(updatedOrder)
            setWorking(false)
            setDisabled(false)
            setInputDisabled(false)
            return
          }
                setOrder(updatedOrder)
                setWorking(false)
                setDisabled(false)
                setInputDisabled(false)
                if (updatedOrder.status === "paid") {
                    setPaid(true)
                }  
        }).catch(err => {
                setError(err)
                setWorking(false)
                setDisabled(false)
                setInputDisabled(false)
                alert('Error', 'Failed to process your order with error: '+ JSON.stringify(err), 'warning')
            })

    }

  return (working ? <Loader text="Verifying your payment and purchasing airtime" /> :
    (error ? <OrderFailure order={order} error={error} /> :
      (paid ? <OrderSuccess order={order} /> : 
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

            {confirmMsg ? <><h2><span>Confirm you are buying {order.package_.name} </span> </h2> 
              <h4><span>Hi {order.purchaser.fullname},</span> </h4>
                                <p>Thank you for verifying this transaction, click the button below to process this transaction.
                <br/>If successful, you will instantly see your airtime.                   
                      </p>
                      <p>You are about to purchase {order.package_.name} for USD${config.pkg_price( order.package_.amount )} under Order #{order._id}</p>
                                    </> : 
                                        
                                        <><h2><span>Check your email to complete this order</span> </h2> 
                                            <h4><span>Hi {order.purchaser.fullname},</span> </h4>
                        <p>Deriv sent an email to your account, please click on the verification link in the email to complete this transaction.
                          <br />This will complete your airtime purchase.
                        </p>
                                        </>}

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i><b>Enter verification code below.</b></li>
                <li><input type="text" readOnly={inputDisabled} value={code} onChange={evt => setCode(evt.target.value)} className="form-control" placeholder="Verification code from Deriv Email" /></li>
              </ul>
              <div className="row">
                <div className="col-md-12">
                    <button onClick={verifyAndPay} disabled={disabled} className="btn btn-block btn-lg btn-danger">Verify and buy {order.package_.name} for USD${config.pkg_price( order.package_.amount )}</button>    
                </div>  
              </div> 
              <ul className="list-unstyled"> 
                <li><i className="vi bi-chevron-right"></i><b>You are paying USD${config.pkg_price(order.package_.amount)}</b></li>
                <li><a href={config.whatsappURI} className="btn btn-danger btn-block" ><i className="vi bi-support"></i>Need help, talk to us on Whatsapp</a></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )))
}

class NewOrder extends Component{
    constructor(props) {
        super(props)

      let pkg = props.package_
      let order = config.getPackage(pkg)
      if (pkg && !order) {
        order = config.currentOrder(true)
      }
        
        this.state = {
          working: true, success: false, order, loggedIn: config.checkLoggedIn(), error: '',
          paymentMethod: props.pmethod ? props.pmethod : 'innbucks'
        }
      
    }

    componentDidMount() {
      let order = config.getPackage(this.props.package_)
      console.log(order)
      if (order && order.id) {
            order.features = null
            config.createNewOrder(order, this.state.paymentMethod, 1).then(order => {
              if (order && order.error) {
                this.setState({ working: false, error: order.error })
                alert('Failed to create new order', order.error, 'warning')
                return
                }
                config.saveCurrentOrder(order)
                this.setState({order, working: false, success: true, redirect: "/order/"+order._id})
            }).catch(err => {

                this.setState({working: false, error: err, order})
            })    
        } else {
        alert('Failed to create new order', 'Invalid package', 'warning')    
        this.setState({ working: false, success: true, redirect: '/packages' })
            
        }
    }

    render() {
      return this.state.loggedIn ? (this.state.working ? <Loader text={"Creating order for " + this.props.package_ + " paying using " + this.state.paymentMethod  } /> : (this.state.success ?
            <Navigate to={this.state.redirect} /> :
            <OrderFailure reason={"Failed to create new order"} pmethod={this.state.paymentMethod} error={this.state.error} order={this.state.order} />)) : <Navigate to="/login" /> 
    }
    
}


function Order(props) {

    let [loading, setLoading] = useState(true)
    let [order, setOrder] = useState(config.currentOrder())
    let [error, setError] = useState('')

    useEffect(() => {
        let url_params = config.urlParams()
      
        let _id = props.params.id && props.params.id ? props.params.id : (url_params && url_params.utm_content ? url_params.utm_content : "")
        if (_id !== "new") {
            console.log(props.params)
            
          config.fetchOrder(_id).then(order_ => {
            if (order_ && order_.error) {
              alert('Error', 'Failed to load order with error: '+ JSON.stringify(order_.error), 'warning')
              setError(order_.error)

              setLoading(false)
              return
                }
                setOrder(order_)
                setLoading(false)
            }).catch(err => {
                setLoading(false)
                setOrder({
                    status: 'cancelled',
                })
                setError(err)
            })    
        } else {

        }
        
    }, [props.params, props.params.id, setOrder, setLoading, setError])
    
    let page = <></>
    if (order && props.params.id !== "new" && !loading) {
      if (order.status === 'pending') {
        if (order.payment_method === 'innbucks') {
          page = <OrderPendingInnbucks order={order} />
        }
        else if (order.payment_method === 'deriv') {
          page = <OrderPendingDeriv order={order} />
        } else {
          page = <OrderFailure order={order} error={{error: "Unsupported payment method "}} />
        }
        } else if (order.status === 'cancelled') {
            page = <OrderFailure order={order} error={error} />
        } else if (order.status === 'paid') {
            page = <OrderSuccess order={order} />
        }
    }
    
  
    

    return props.params.id === "new" ? <NewOrder package_={props.params.package_} /> : (loading ? <Loader text="Loading your order" /> : page)
}

export default withRouter(Order)