import { useState } from "react"
import config from "./config"

function ListOrders(props) {

    let [orders, setOrders] = useState([])
    let [filter, setFilter] = useState("recent")
    let apiKey = props.api_key

    let loadSpecificOrder = () => {
        let id = prompt("Please enter the order id here")

        alert("Loading orders for " + id)
    }

    let applyOrdersFilter = (filter) => {
        setFilter(filter)

        config.admin.filterOrders(apiKey, filter).then(orders => {
            setOrders(orders)
        }).catch(err => {
            alert('Filter orders', 'Failed to filter orders, see log for error', 'error')
            console.log(err)
        })
    }

    let addNewStock = () => {

    }

    return (
        <div className="row" data-aos="fade-up" data-aos-delay="100">
                        <div className="block-pricing">
                            <div className="pricing-table">
                                <h4>Manage Orders</h4>
                                <div className="table_btn">
                                    <button onClick={addNewStock} disabled={false} className="btn btn-success"><i className="bi bi-cart"></i> Add new stock</button>
                                </div>
                                <div className="table_btn">
                                    <button onClick={loadSpecificOrder} disabled={false} className="btn btn-warning"><i className="bi bi-eye"></i> Load specific order</button>
                                </div>
                                <div>
                                    <div className="form-control">
                                        <select value={filter} onChange={evt => applyOrdersFilter(evt.target.value)} className="form-control">
                                            <option value="paid">Paid Orders</option>
                                            <option value="recent">Most Recent Orders</option>
                                            <option value="today">Orders from today only</option>
                                            <option value="failed">Failed orders</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="table-responsive-xl">
  <table className="table">
    <thead>
      <tr>
        <th scope="col">#Order ID</th>
        <th scope="col">Status</th>
        <th scope="col">Package</th>
        <th scope="col">User</th>
        <th scope="col">Email</th>
        <th scope="col">User CR</th>
        <th scope="col">Amount</th>
        <th scope="col">Token</th>
        <th scope="col">Action</th>
      </tr>
    </thead>
    <tbody>
        {orders.forEach(order => {
     <tr>
         <th scope="row">{order._id}</th>
         <td><div className="pill pill-danger">{order.status}</div></td>
         <td>{order.package_}</td>
         <td>{order.fullname}</td>
         <td>{order.email}</td>
         <td>{order.cr}</td>
         <td>{order.amount}</td>
         <td>{order.token ? order.token.pretty : "N/A"}</td>
        <td><a href="/#">Refund</a></td>
      </tr>
        })}
      
    </tbody>
  </table>
        </div>
                                
                            </div>
                        </div>
                    </div>
    )
}

function ListStock(props) {

    let [orders, setStock] = useState([])
    let [filter, setFilter] = useState("recent")
    let apiKey = props.api_key

    let applyOrdersFilter = (filter) => {
        setFilter(filter)

        config.admin.filterOrders(apiKey, filter).then(orders => {
            setStock(orders)
        }).catch(err => {
            alert('Filter orders', 'Failed to filter orders, see log for error', 'error')
            console.log(err)
        })
    }

    let addNewStock = () => {

    }

    return (
        <div className="row" data-aos="fade-up" data-aos-delay="100">
                        <div className="block-pricing">
                            <div className="pricing-table">
                                <h4>Manage Stock</h4>
                                <div className="table_btn">
                                    <button onClick={addNewStock} disabled={false} className="btn btn-success"><i className="bi bi-cart"></i> Add new stock</button>
                                </div>
                                <div>
                                    <div className="form-control">
                                        <select value={filter} onChange={evt => applyOrdersFilter(evt.target.value)} className="form-control">
                                            <option value="paid">Paid Orders</option>
                                            <option value="recent">Most Recent Orders</option>
                                            <option value="today">Orders from today only</option>
                                            <option value="failed">Failed orders</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="table-responsive-xl">
  <table className="table">
    <thead>
      <tr>
        <th scope="col">#Order ID</th>
        <th scope="col">Status</th>
        <th scope="col">Package</th>
        <th scope="col">User</th>
        <th scope="col">Email</th>
        <th scope="col">User CR</th>
        <th scope="col">Amount</th>
        <th scope="col">Token</th>
        <th scope="col">Action</th>
      </tr>
    </thead>
    <tbody>
        {orders.forEach(order => {
     <tr>
         <th scope="row">{order._id}</th>
         <td><div className="pill pill-danger">{order.status}</div></td>
         <td>{order.package_}</td>
         <td>{order.fullname}</td>
         <td>{order.email}</td>
         <td>{order.cr}</td>
         <td>{order.amount}</td>
         <td>{order.token ? order.token.pretty : "N/A"}</td>
        <td><a href="/#">Refund</a></td>
      </tr>
        })}
      
    </tbody>
  </table>
        </div>
                                
                            </div>
                        </div>
                    </div>
    )
}

export default function Admin(props) {

    let [apiKey, setApiKey] = useState("")
    

    let stockReport = () => {

    }

    let ordersReport = () => {

    }
    

    return (
        <>
            <section id="pricing" className="padd-section text-center">

                <div className="container" data-aos="fade-up">
                    <div className="section-title text-center">

                        <h2>Boom263 Admin Portal</h2>
                        <p className="separator">Manage orders and add new stock here.
                        </p>
                        <div className="table_btn">
                            <label>API Key</label>
                            <input type="password" className="form-control" value={apiKey} placeholder="Insert API Key here. Necessary to perform admin functions" onChange={evt => { setApiKey(evt.target.value); config.admin.setApiKey(evt.target.value) } } />
                        </div>
                        <div className="table_btn">
                            <button disabled={false} onClick={stockReport} className="btn btn-primary"><i className="bi bi-list"></i> Get stock report</button>
                        </div>
                        <div className="table_btn">
                            <button disabled={false} onClick={ordersReport} className="btn btn-info"><i className="bi bi-cart"></i> Get orders report</button>
                        </div>
                        
                    </div>
                    <ListStock />
                    <ListOrders />
                </div>

            </section>

        </>
    )
}