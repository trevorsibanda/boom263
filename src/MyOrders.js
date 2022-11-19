import { useState } from "react"
import { Link } from "react-router-dom"
import Loader from "./Loader"



export default function MyOrders(props) {

  let [loading, setLoading] = useState(false)
  let [orders, setOrders] = useState([])

    return loading ? <Loader text="Loading your orders" /> : (
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

              <h2><span>Past Orders</span> </h2>
              <h4><span>Deriv account CR1234567</span> </h4>
              <p>Find your orders showwn below :)
              </p>

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i><Link to="/"  > Bought Econet 1USD , 3 days ago</Link></li>
                <li><i className="vi bi-chevron-right"></i><Link to="/" className="text-danger" >FAILED: Econet 1USD , 3 days ago</Link></li>
                <li><i className="vi bi-chevron-right"></i>Retina Ready</li>
                <li><i className="vi bi-chevron-right"></i>Easy to Use</li>
                <li><i className="vi bi-chevron-right"></i>Unlimited Features</li>
                <li><i className="vi bi-chevron-right"></i>Unlimited Features</li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}