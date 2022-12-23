import { Component } from "react";
import {Navigate} from "react-router-dom"
import config from "./config";
import Loader from "./Loader";
import withRouter from "./withRouter";


class Buy extends Component {
    
    
    constructor(props) {
        console.log(props)
        super(props)

        let package_ = null
        config.packages.forEach(pkg => {
            if (pkg.id === props.params.package_) {
                package_ = pkg
            }
            return 
        })

        this.state = {
            package_id: props.params.package_,
            package_,
            redirectToLogin: false,
            redirectToOrder: false,
            order: { id: 'new' },
            loading: true,
            loadingMsg: "Loading package"
        }


        this.onPayClick = this.onPayClick.bind(this)

        if (!config.checkLoggedIn()) {
            config.setPostLogin('/buy/' + this.state.package_id)
            this.setState({redirectToLogin: true})
        }


    }

    componentDidMount() {
        if (this.state.package_ === null) {
            this.setState({redirectToOrder: true, loading: false})
        } else {
            this.setState({loading: false})
        }
    }

    onPayClick() {
        this.setState({loading: true, loadingMsg: "Creating order for " + this.state.package_.name})
        config.setPostLogin('/buy/' + this.state.package_id)
        config.saveCurrentOrder({
         package_: this.state.package_, status: 'not_created',
        }).then((order) => {
            if (order.error) {
                window.alert("Failed to create order", order.error, "error")
                this.setState({ loading: false })
                return
            }
            this.setState({ order })
            this.setState({ loading: false, redirectToOrder: true })
        }).catch((err) => {
            window.alert("Failed to create order", err.message, "error")
            this.setState({ loading: false })
        })
        
        
    }

    render() {

        let component = (
            <section id="pricing" className="padd-section text-center">

                <div className="container" data-aos="fade-up">
                    <div className="section-title text-center">

                        <h2>Buy {this.state.package_.name}</h2>
                        <p className="separator">Secure and safe payment using your Deriv balance.</p>
                    </div>
                    <div className="row" data-aos="fade-up" data-aos-delay="100">
                        <div className="block-pricing">
                            <div className="pricing-table">
                                <h4>{this.state.package_.provider}</h4>
                                <h2>USD ${this.state.package_.amount}</h2>
                                <ul className="list-unstyled">
                                    <li>
                                        <img src={"/assets/img/"+ this.state.package_id + ".png"} alt="recharge card" style={{ maxWidth: "200px" }} />
                                    </li>
                                    <li>Save up to 15% compared to buying using DerivP2P</li>
                                    <li>Safe and secure payment</li>
                                    <li><strong>IMPORTANT:</strong>
                                        <span class="text-danger">By clicking Buy, we will send you a Deriv payment
                                            agent withdrawal request to your account. When you click on the link sent to your email,
                                            we will process your airtime payment.</span></li>
                                </ul>
                                <div className="table_btn">
                                    <button onClick={this.onPayClick} disabled={this.state.loading} className="btn btn-success"><i className="bi bi-cart"></i>Pay USD${config.pkg_price(this.state.package_.amount)} with Deriv </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        )
    
        if (this.state.redirectToOrder) {
            component = < Navigate to={'/order/new/' + this.state.package_id} />
        }
    
        if (this.state.redirectToLogin) {
            
            component = <Navigate to="/login" />
        }

        return  this.state.loading ? <Loader text={this.state.loadingMsg} /> : component
    }
}

export default withRouter(Buy);