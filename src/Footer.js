import { Component } from "react";
import { Link } from "react-router-dom";

class Footer extends Component {

    render() {
        return (
            <footer className="footer">
                <div className="container">
                    <div className="row">

                        <div className="col-md-12 col-lg-4">
                            <div className="footer-logo">

                                <Link className="navbar-brand" to="/">Boom263</Link>
                                <p>is a secure e-commerce platform that allows you to buy airtime, data bundles and pay for utility bills
                                    using your Deriv balance.</p>

                            </div>
                        </div>

                        <div className="col-sm-6 col-md-3 col-lg-2">
                            <div className="list-menu">

                                <h4>About Us</h4>

                                <ul className="list-unstyled">
                                    <li><Link to="/about">About us</Link></li>
                                    <li><a href="/#">DerivP2P Account</a></li>
                                    <li><a href="/whatsapp">Talk to us on Whatsapp</a></li>
                                    <li><a href="/tnc">Deriv Terms and Conditions</a></li>
                                </ul>

                            </div>
                        </div>


                    </div>
                </div>

            </footer>
        )
    }
}

export default Footer;