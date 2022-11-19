import { Component, useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import config from "./config"
import Loader from "./Loader"
import withRouter from "./withRouter"


function OrderFailure(props) {
    let {order} = props
    return (
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

              <h2><span>{props.reason ? props.reason : "An error occured"}</span> </h2>
              <h4><span>Hi Ezra,</span> </h4>
                                <p>The action failed with error: 
                                    
              </p>

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i><b>OrderID</b> {order.id}</li>
                <li><i className="vi bi-chevron-right"></i><b>Package</b> {order.package_}</li>
                <li><i className="vi bi-chevron-right"></i><b>Amount</b> {order.amount}</li>
                <li><i className="vi bi-chevron-right"></i><b>REASON FAILED</b>: <pre>{JSON.stringify(props.error)}</pre></li>
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
    console.log(props.order)
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
            <h4><span>Successfully bought {order.name}</span> </h4>
              <p>Thank you for using Boom263, find your order below.</p>
              <div className="block-pricing">
              <div className="pricing-table">
                <ul className="list-unstyled">
                        <li>
                            <img src="/assets/img/cards.png" style={{width: "100%"}} />
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
                    <Link to={"/buy/"+order.package_} className="btn btn-default"><i className="bi bi-cart"></i> Buy this again</Link>
                </div>
              </div>
            </div>

               
              <ul className="list-unstyled"> 
                <li><i className="vi bi-chevron-right"></i>Order ID: <b>{order._id}</b></li>
                <li><i className="vi bi-chevron-right"></i>Buyer account: <b>{order.cr}</b></li>
                <li><i className="vi bi-chevron-right"></i>Amount Paid: <b>USD${order.price}</b></li>
                <li><i className="vi bi-chevron-right"></i>Time Paid: <b>{order.paidAt}</b></li>
                <li>Need help? <a href="">Talk to our customer support on Whatsapp</a></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}

function OrderPending(props) {
    let [order, setOrder] = useState(props.order)
   
    let [email, setEmail] = useState("")
    let [code, setCode] = useState("")
    let [disabled, setDisabled] = useState(true)
    let [inputDisabled, setInputDisabled] = useState(true)
    let [confirmMsg, setConfirmMsg] = useState(false)
    let [paid, setPaid] = useState(false)
    let [working, setWorking] = useState(false)

    useEffect(() => {
        let params = config.urlParams()
        if (params && params.code && !working) {
            setCode(params.code)
            setInputDisabled(true)
            setDisabled(true)
            setConfirmMsg(true)
            setWorking(true)

            config.verifyAndPay(order._id, code, email).then(updatedOrder => {
                
                setOrder(updatedOrder)
                setWorking(false)
                setDisabled(false)
                setInputDisabled(false)
                if (updatedOrder.status === "complete") {
                    setPaid(true)
                }  
            }).catch(err => {
                setWorking(false)
                setDisabled(false)
                setInputDisabled(false)
                alert('Error', 'Failed to process your order with error: '+ JSON.stringify(err), 'warning')
            })

            
        } else {
            setInputDisabled(true)
            setDisabled(true)
        
        }

    }, [setCode, setDisabled, setWorking, code, order._id, setInputDisabled])

    let verifyAndPay = () => {

        if (code.length <= 4) {
            return alert('Verification code needed', "Please enter a valid verification code sent to your Deriv email address")
        }

        setWorking(true)
        setDisabled(true)
        setInputDisabled(true)


        config.verifyAndPay(order._id, code, email).then(updatedOrder => {
            
            setOrder(updatedOrder)
            setWorking(false)
            setDisabled(false)
            setInputDisabled(false)
            if (updatedOrder.status === "complete") {
                setPaid(true)
            }  
        }).catch(err => {
            setWorking(false)
            setDisabled(false)
            setInputDisabled(false)
            alert('Error', 'Failed to process your order with error: '+ JSON.stringify(err), 'warning')
        })

    }

    return working ? <Loader text="Verifying your payment and purchasing airtime" /> : (
        paid ? <OrderSuccess order={order} /> : 
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

            {confirmMsg ? <><h2><span>Confirm you are buying {order.name} </span> </h2> 
              <h4><span>Hi Ezra,</span> </h4>
                                <p>Thank you for verifying this transaction, click the button below to process this transaction.
                <br/>If successful, you will instantly see your airtime.                   
                                        </p>
                                    </> : 
                                        
                                        <><h2><span>Check your email to complete this order</span> </h2> 
                                            <h4><span>Hi {order.buyer},</span> </h4>
                                <p>Deriv sent an email to your account, please click on the verification link in the email to complete this transaction.
                <br/>This will complete your airtime purchase.                   
                                        </p>
                                        </>}

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i><b>Enter verification code below.</b></li>
                <li><input type="text" readOnly={inputDisabled} value={code} onChange={evt => setCode(evt.target.value)} className="form-control" placeholder="Verification code from Deriv Email" /></li>
              </ul>
              <div className="row">
                <div className="col-md-12">
                    <button onClick={verifyAndPay} disabled={disabled} className="btn btn-block btn-lg btn-danger">Verify and buy Econet USD $1.00</button>    
                </div>  
              </div> 
              <ul className="list-unstyled"> 
                <li><i className="vi bi-chevron-right"></i><b>You are paying ${order.price}</b></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}

class NewOrder extends Component{
    constructor(props) {
        super(props)

        
        this.state = {
            working: true, success: false, order: config.currentOrder(), error: ''
        }
        

        
       
        
    }

    componentDidMount() {
        let order = config.currentOrder()
        if (order && order.package_) {
            config.createNewOrder(order.package_, 1).then(order => {
                config.saveCurrentOrder(order)
                this.setState({order, working: false, success: true, redirect: "/order/"+order._id})
            }).catch(err => {
                this.setState({working: false, error: err})
            })    
        } else {
            this.setState({ working: false, success: true, redirect: '/packages'  })
            
        }
    }

    render() {
        return  this.state.working ? <Loader text="Creating your order..." /> : (this.state.success ?
            <Navigate to={this.state.redirect} /> :
            <OrderFailure reason={"Failed to create new order"} error={this.state.error} order={this.state.order} />) 
    }
    
}


function Order(props) {

    let [loading, setLoading] = useState(true)
    let [order, setOrder] = useState(config.currentOrder())
    let [error, setError] = useState('')

    useEffect(() => {

        
        if (props.params.id !== "new") {
            

            config.fetchOrder(props.params.id).then(order_ => {
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
        
    }, [props.params.id, setOrder, setLoading, setError])
    
    let page = <></>
    if (order && props.params.id !== "new" && !loading) {
        if (order.status === 'pending') {
            page = <OrderPending order={order} />
        } else if (order.status === 'cancelled') {
            page = <OrderFailure order={order} error={error} />
        } else if (order.status === 'complete') {
            page = <OrderSuccess order={order} />
        }
    }

    return props.params.id === "new" ? <NewOrder /> : (loading ? <Loader text="Loading your order" /> : page)
}

export default withRouter(Order)