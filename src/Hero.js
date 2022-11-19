import { Link } from "react-router-dom";


function Hero() {
    return (
  <section id="hero">
    <div className="hero-container" data-aos="fade-in">
      <h1>Welcome to Boom263</h1>
      <h2>Instantly buy airtime, data bundles and more at a fair price using your Deriv balance.</h2>
      <img src="assets/img/hero-img.png" alt="Hero Imgs" data-aos="zoom-out" data-aos-delay="100" />
      <Link to="/login" className="btn-get-started scrollto">Login with Deriv</Link>
      <div className="btns">
        <Link to="/orders"><i className="fa fa-apple fa-3x"></i> My Orders</Link>
        <Link to="/about"><i className="fa fa-windows fa-3x"></i> Help and support</Link>
      </div>
    </div>
  </section>

    )
}

export default Hero;