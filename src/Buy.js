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
    let [redirectToLogin, setRedirectToLogin] = useState(false)
    let [redirectToOrder, setRedirectToOrder] = useState(false)
    let [loading, setLoading] = useState(true)
    let [loadingMsg, setLoadingMsg] = useState("Loading package")

    let loadPkg = () => {
        let package__ = null
        config.packages.forEach(pkg => {
            if (pkg.id === props.params.package_) {
                package__ = pkg
            }
        })
        if (package__ === null) {
            alert('Load package', 'Failed to load package with id: ' + props.params.package_)
            setLoading(false)
            setRedirectToOrder(true)
            return
        }

        if (package__.amount < 10) {
            setPmethod("innbucks")
        }

        setPackage_(package__)

        setLoading(false)
    }

    let checkLogin = () => {
        if (!config.checkLoggedIn()) {
            config.setPostLogin('/buy/' + package_.id)
            setRedirectToLogin(true)
        }
    }

    let onPayClick = () => {
        setLoading(true)
        setLoadingMsg("Creating order for " + package_.name + "paying using " + pmethod)
        config.setPostLogin('/buy/' + package_.id)
        config.saveCurrentOrder({
            package_, status: 'not_created', 
            payment_method: pmethod,
        }).then((order_) => {
            if (order_.error) {
                window.alert("Failed to create order", order_.error, "error")
                setLoading(false)
                return
            }
            setLoading(false)
            setRedirectToOrder(true)
        }).catch((err) => {
            window.alert("Failed to create order", err.message, "error")
            setLoading(false)
        })
        
        
        
    }
    

    useEffect(() => {
        checkLogin()
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
                                <li>Pay <Money value={config.pkg_price(pmethod,package_.amount)} /> only</li>

                            </ul>
                            <div className="table_btn">
                                
                                <button onClick={onPayClick} disabled={loading} className="btn btn-success"><i className="bi bi-cart"></i>Order {package_.name} for <Money value={config.pkg_price(pmethod,package_.amount)} /></button>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    )

    if (redirectToOrder) {
        component = < Navigate to={'/order/new/' + package_.id + "/" + pmethod} />
    }

    if (redirectToLogin) {
        component = <Navigate to="/login" />
    }

    return  loading ? <Loader text={loadingMsg} /> : component

}

export default withRouter(Buy);