import { Link } from "react-router-dom";
import config from "./config";


function Hero() {
  let btnLink = config.checkLoggedIn() ? "/orders" : "/login"
  let logout = (evt) => {
    evt.preventDefault()
    config.logout()
  }

    return (
  <section id="hero">
    <div className="hero-container" data-aos="fade-in">
      <h1>Welcome to <span className="text-success">Boom</span><span className="text-danger">263</span></h1>
      <h2>Instantly buy airtime, data bundles and more at a fair price using your Deriv balance.</h2>
      <img src="/assets/img/hero-img.png" alt="Hero Imgs" data-aos="zoom-out" data-aos-delay="100" />
          <Link to={btnLink} className="btn-get-started scrollto">{config.checkLoggedIn() ? ("Hello, " + config.localUser().fullname) : "Login with Deriv"}</Link>
      <div className="btns">
        <Link to="/orders"><i className="fa fa-apple fa-3x"></i> My Orders</Link>
        {config.checkLoggedIn() ?
         <a href="/logout" onClick={logout}><i className="fa fa-apple fa-3x"></i> Logout</a> :
         <Link to="/about"><i className="fa fa-windows fa-3x"></i> Help and support</Link>    
        }
      </div>
    </div>
  </section>

    )
}

export default Hero;