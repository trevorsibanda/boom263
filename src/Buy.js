import { useEffect, useState } from "react";
import {Navigate} from "react-router-dom"
import config from "./config";
import Loader from "./Loader";
import withRouter from "./withRouter";


function Buy(props) {

    let [package_, setPackage_] = useState({
        id: props.params.package_,
        name: "Loading...", 
        amount: 0,
        description: "Loading...",
        data: "Loading...",

    })
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
        setLoadingMsg("Creating order for " + package_.name)
        config.setPostLogin('/buy/' + package_.id)
        config.saveCurrentOrder({
         package_, status: 'not_created',
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
                <div className="section-title text-center">

                    <h2>Buy {package_.name}</h2>
                    <p className="separator">Secure and safe payment using your Deriv balance.</p>
                </div>
                <div className="row" data-aos="fade-up" data-aos-delay="100">
                    <div className="block-pricing">
                        <div className="pricing-table">
                            <h4>{package_.provider}</h4>
                            <h2>USD ${package_.amount}</h2>
                            <ul className="list-unstyled">
                                <li>
                                    <img src={"/assets/img/"+ package_.id + ".png"} alt="recharge card" style={{ maxWidth: "200px" }} />
                                </li>
                                <li>Save up to 15% compared to buying using DerivP2P</li>
                                <li>Safe and secure payment</li>
                                <li><strong>IMPORTANT:</strong>
                                    <span class="text-danger">By clicking Buy, we will send you a Deriv payment
                                        agent withdrawal request to your account. Click on the link in the email and you will be taken to a page to confirm processing your order.</span></li>
                            </ul>
                            <div className="table_btn">
                                <button onClick={onPayClick} disabled={loading} className="btn btn-success"><i className="bi bi-cart"></i>Pay USD${config.pkg_price(package_.amount)} with Deriv </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    )

    if (redirectToOrder) {
        component = < Navigate to={'/order/new/' + package_.id} />
    }

    if (redirectToLogin) {
        
        component = <Navigate to="/login" />
    }

    return  loading ? <Loader text={loadingMsg} /> : component

}

export default withRouter(Buy);