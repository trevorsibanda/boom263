import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import config from "./config"
import Loader from "./Loader"
import Money from "./Money"



export default function MyOrders(props) {

  let [loading, setLoading] = useState(true)
  let [orders, setOrders] = useState([])
  let innbucksOrders = config.fetchInnbucksOrders()


  useEffect(() => {
    window.pageview("My Orders")
    load()
  }, [])

  let load = () => {
    config.pastOrders().then(orders_ => {
      if (orders_ && orders_.error) {
        alert('Load orders', 'Failed to load your orders with error: ' + JSON.stringify(orders_.error))
        setLoading(false)
        return
      }
      if (orders_ &&  orders_.length === 0) {
        alert('Load orders', 'You have no past orders')
        setLoading(false)
        return
      }
      setOrders(orders_ || [])
      setLoading(false)
    }).catch(err => {
      alert('Load orders', 'Failed to load your orders with error: ' + JSON.stringify(err))
      setLoading(false)
    })
  }

  let order_status = {
    "cancelled": <span className="text-danger"><b>CANCELLED</b></span>,
    "pending": <span className="text-warning"><b>PENDING</b></span>,
    "paid": <span className="text-success"><b>PAID</b></span>,
  }

    return loading ? <Loader text="Loading your orders" /> : (
          <main id="main">

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">
              <h2><span>Innbucks Orders</span> </h2>
                  <p>Stored on your device's local storage.
                    <b>Note that unpaid orders will be cancelled and deleted after 2 hours</b>

              </p>

              <ul className="list-unstyled"> 
                    {innbucksOrders.map(order => {
                      return (<li><i className="vi bi-chevron-right"></i><Link to={"/order/" + order._id}><span class="text-danger">{order.quantity} x {order.package_.name}</span> for <Money value={order.amount} />.<br/>Created {order.created["@ts"]}<br />ID: {order._id}</Link></li>)
                    })}
                    
                
              </ul>
              
              <h2><span>Deriv Orders</span> </h2>
                  <p>Past orders are shown below.
                    <b>Note that unpaid orders will be cancelled and deleted after 2 hours</b>
                    <br />
                    <span>You must be logged in using Deriv to see your orders</span>
              </p>
              <ul className="list-unstyled">
                    {orders.map(order => {
                      return (<li><i className="vi bi-chevron-right"></i><Link to={"/order/" + order._id}>{order_status[order.status]} {order.package_.name} for USD${order.package_.amount} <br />ID: {order._id}</Link></li>)
                    })}
                    
                
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}