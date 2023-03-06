import { useEffect, useState } from "react";
import {Navigate} from "react-router-dom"
import config from "./config";
import Loader from "./Loader";
import Money from "./Money";
import withRouter from "./withRouter";


function Buy(props) {

    let [package_, setPackage_] = useState({
        id: props.params.package_,
        name: "Loading...", 
        amount: 0,
        description: "Loading...",
        data: "Loading...",

    })
    let [pmethod, setPmethod] = useState("deriv")
    let [quantity, setQuantity] = useState(1)
    let [phone, setPhone] = useState(config.localUser().phone)
    let quantities = [1,2,3,4,5]
    let [redirect, setRedirect] = useState(false)
    let [error, setError] = useState(null)
    let [loading, setLoading] = useState(true)
    let [loadingMsg, setLoadingMsg] = useState("Loading package")

    let loadPkg = () => {
        if (package_.amount !== 0) {
            return
        }
        let package__ = null
        config.packages.forEach(pkg => {
            if (pkg.id === props.params.package_) {
                package__ = pkg
            }
        })
        if (package__ === null) {
            alert('Load package', 'Failed to load package with id: ' + props.params.package_)
            setLoading(false)
            setRedirect("/packages")
            return
        }
        window.pageview("Buy "+ package__.name + " for " + config.moneyFormat(config.pkg_price(pmethod,package_.amount)))
        if (package__.amount < 10) {
            setPmethod("innbucks")
        }

        setPackage_(package__)

        setLoading(false)
    }

    let onPayClick = (evt) => {
        if (!config.checkPhone(phone)) {
            alert("Invalid phone number", "Please enter a valid phone number. This is used to keep track of your orders as well as important updates", "info")
            return
        }
        setLoading(true)
        config.setPostLogin('/buy/' + package_.id)
        if (pmethod === "deriv" && !config.checkLoggedIn()) {
            alert("Login required", "Login to Deriv to pay using your Deriv balance.", "info")
            setTimeout(() => {
                setLoading(false)
                setRedirect("/login")
            }, 2500)
            return
        }
        
        setLoading(true)
        setLoadingMsg("Creating order for " + package_.name + "paying using " + pmethod)
        evt.preventDefault()   
        newOrder()
    }

    let newOrder = () => {
      config.saveCurrentOrder({
            package_, status: 'not_created', 
            payment_method: pmethod,
            quantity
        })
        window.pageview("Creating new order...")
        setLoading(true)
        setLoadingMsg("Creating new order for " + quantity + "x " + package_.id + " using " + pmethod)  
      if (package_ && package_.id) {
          package_.features = null
          let user = config.localUser()
          user.phone = phone
          config.setLocalUser(user)
          return config.createNewOrder(package_, pmethod, quantity, phone).then(order => {
              if (order && order.error) {
                  setLoading(false)
                  setError(order.error)
                  alert('Failed to create new order', order.error, 'warning')
                  return
              }
              if (order.payment_method === 'innbucks') {
                  config.saveInnbucksOrder(order)
              }
              config.saveCurrentOrder(order)
              setLoading(false)
              setRedirect("/order/" + order._id)
          }).catch(err => {
              setError(err)
              setLoading(false)
              alert('Failed to create new order', err.error || "An unhandled error occured", 'warning')
          })    
        } else {
          alert('Failed to create new order', 'Invalid package', 'warning')
          setRedirect("/packages")
          setLoading(false)   
        }
    }
    

    useEffect(() => {
        
        loadPkg()
        })

    let component = (
        <section id="pricing" className="padd-section text-center">

            <div className="container" data-aos="fade-up">
                
                <div className="row" data-aos="fade-up" data-aos-delay="100">
                    <div className="block-pricing">
                        <div className="pricing-table">
                            <h4>Buy {package_.name}</h4>
                            <p>{package_.description}</p>
                            <h2><Money value={package_.amount} /></h2>
                            <ul className="list-unstyled">
                                <li>
                                    <img src={"/assets/img/"+ package_.id + ".png"} alt="recharge card" style={{ maxWidth: "200px" }} />
                                </li>
                                {pmethod === "deriv" ? <li>Save up to 15% compared to buying using DerivP2P</li> : null}
                                {pmethod === "innbucks" ? <li>Anytime, instant payments using Innbucks.</li> : null}
                                <li>Safe and secure payment</li>
                                <li>
                                    <label>Payment method</label>
                                    <select value={pmethod} onChange={evt => setPmethod(evt.target.value)} className="form-control" id="payment_method">
                                    <option value={"innbucks"} >InnBucks</option>
                                    { package_.amount >= 10 ?
                                        <option value={"deriv"} >Deriv Balance</option> : null
                                    }
                                    </select>
                                {pmethod === "deriv" ? <>
                                    <strong>Paying with Deriv:</strong>
                                        <p style={{textTransform: "none"}}  >Payment is in the form of a secure Deriv payment agent withdrawal request.
                                            On clicking Buy, an email will be sent to you with a link to confirm the payment.</p>
                                        </>
                                    : null}
                                {pmethod === "innbucks" ?
                                    <><strong>Paying with Innbucks:</strong>
                                        <p style={{textTransform: "none"}} >You will be required to send the <strong className="text-danger">EXACT Amount</strong> to a number shown on
                                            the next page. After sending, enter the Ref from the Innbucks transaction and the payment
                                            will be instantly verified</p>
                                    </>
                                        : null}
                                </li>
                                
                                <li>
                                    <label>Quantity</label>
                                    <select value={quantity} onChange={evt => setQuantity(evt.target.value)} className="form-control" id="payment_method">
                                        {quantities.map(q => {
                                            return <option value={q} >{q}     for   {config.moneyFormat(config.pkg_price(pmethod,package_.amount) * q)}</option>
                                    })    
                                    }
                                    </select>
                                </li>
                                <li>
                                    <label>* Your Phone Number</label>
                                    <input type="text" required value={phone} onChange={evt => setPhone(evt.target.value)} placeholder="Required. Your phone number" className="form-control" />
                                </li>

                            </ul>
                            <div className="table_btn">
                                {error ? <div class="alert alert-danger">
                                    <h4>Error</h4>
                                    <p>{ error.error || "Server error" }</p>
                                </div> : null}
                                <button onClick={onPayClick} disabled={loading} className="btn btn-success"><i className="bi bi-cart"></i>Order {package_.name} for <Money value={config.pkg_price(pmethod,package_.amount) * quantity} /></button>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    )

    if (redirect) {
        window.event("Redirect", "Page", redirect)
        component = <Navigate to={redirect} />
    }
    if (loading) {
        component = <Loader text={loadingMsg} />
    }

    return  component

}

export default withRouter(Buy);