import { useState } from "react"
import config from "./config"

function ListOrders(props) {

    let [orders, setOrders] = useState([])
    let [filter, setFilter] = useState("recent")

    let loadSpecificOrder = () => {
        let id = prompt("Please enter the order id here")

        alert("Loading orders for " + id)
    }

    let applyOrdersFilter = (filter) => {
        setFilter(filter)

        config.admin.filterOrders(filter).then(norders => {
            if (norders.error) {
                alert('Failed to filter orders', norders.error, 'error')
                return
            }
            setOrders(norders)
        }).catch(err => {
            alert('Filter orders', 'Failed to filter orders, see log for error', 'error')
            console.log(err)
        })
    }

    let doRefund = () => {
        alert('Process refund. Contact person directly')
    }

    return (
        <div className="row" data-aos="fade-up" data-aos-delay="100">
                        <div className="block-pricing">
                            <div className="pricing-table">
                                <h4>Manage Orders</h4>
                                
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
        {orders.map(order => {
     return <tr>
         <th scope="row">{order._id}</th>
         <td><div className="pill pill-danger">{order.status}</div></td>
         <td>{order.package_.id}</td>
         <td>{order.purchaser.fullname}</td>
         <td>{order.purchaser.email}</td>
         <td>{order.cr}</td>
         <td>{order.package_.amount}/{config.pkg_price(order.package_.amount)}</td>
         <td>{order.token ? order.token.pretty : "N/A"}</td>
        <td><a href="/#" class="text-danger" onClick={doRefund}>Refund</a></td>
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
function AddStock() {
    let [stock, setStock] = useState([{
        package_: config.packages[0],
        pin: ""
    }])
    
    let addNewStock = () => {
        stock.push({
            package_: config.packages[0],
            pin: ""
        })
        let nstock = [...stock]
        setStock(nstock)
    }

    let saveStock = () => {
        config.admin.saveStock(stock).then(res => {
            if (res.error) {
                alert('Failed to save stock', res.error, 'error')
                return
            }
            alert('Stock saved successfully', 'Stock saved successfully, reload stock to see new entries', 'success')
        }).catch(err => {
            alert('Save stock', 'Failed to save stock, see log for error', 'error')
            console.log(err)
        })
    }

    let removeStock = (index) => {
        stock.splice(index, 1)
        let nstock = [...stock]
        setStock(nstock)
    }

    let updateStockPackage = (evt, index) => {
        stock[index].package_ = evt.target.value
        let nstock = [...stock]
        setStock(nstock)
    }

    let updateStockPin = (evt, index) => {
        stock[index].pin = evt.target.value
        let nstock = [...stock]
        setStock(nstock)
    }

    

    return (
        <div className="row" data-aos="fade-up" data-aos-delay="100">
            <div className="block-pricing">
                <div className="pricing-table">
                    <h4>Add new stock</h4>
                </div>
                {stock.map((stock_, index) => {
                    return <div className="row">
                        <div className="col-md-4 col-sm-6 col-xs-6">
                            <div className="form-group">
                                <label>Package</label>
                                <select className="form-control" value={stock.package_} onChange={evt => updateStockPackage(evt, index)}>
                                    {
                                        config.packages.map((package_, cindex) => {
                                            return <option value={package_.id} tabIndex={index * 10 + cindex}>{package_.name}</option>
                                        }
                                        )
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="col-md-6 col-sm-6 col-xs-6">
                            <div className="form-group">
                                <label>Recharge PIN</label>
                                <input type="text" className="form-control" value={stock_.pin} onChange={evt => updateStockPin(evt, index)} />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="form-group">
                                <button className="btn" onClick={addNewStock}><i className="bi bi-plus text-primary"></i></button>
                                <button className="btn " onClick={() => removeStock(index)}><i className="bi bi-trash text-danger"></i></button>
                            </div>
                        </div>
                    </div>
                })}
                <div className="table_btn">
                    <button onClick={saveStock} disabled={false} className="btn btn-success"><i className="bi bi-cart"></i> Save new stock</button>
                </div>
            </div>
        </div>)
 } 


function ListStock() {

    let [stock, setStock] = useState([])
    let [filter, setFilter] = useState("")

    let applyStocksFilter = (filter) => {
        setFilter(filter)

        config.admin.filterStock(filter).then(nstock => {
            if (nstock.error) {
                alert('Failed to apply filter', JSON.stringify(nstock))
                return
            }
            setStock(nstock)
        }).catch(err => {
            alert('Filter stock', 'Failed to filter stock, see log for error', 'error')
            console.log(err)
        })
    }

    return (
        <div className="row" data-aos="fade-up" data-aos-delay="100">
                        <div className="block-pricing">
                            <div className="pricing-table">
                                <h4>Manage Stock</h4>
                                
                                <div>
                                    <div className="form-control">
                                        <select value={filter} onChange={evt => applyStocksFilter(evt.target.value)} className="form-control">
                                            <option value="free">Free stock</option>
                                            <option value="used">Used stock</option>
                                            {
                                                config.packages.map((package_, index) => {
                                                    return <option value={package_.id} tabIndex={index}>{package_.name}</option>
                                                })
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="table-responsive-xl">
  <table className="table">
    <thead>
      <tr>
        <th scope="col">Package</th>
        <th scope="col">Status</th>
        <th scope="col">PIN code</th>
        <th scope="col">Instructions</th>
        <th scope="col">OCR</th>
        <th scope="col">Created</th>
        <th scope="col">Provider</th>
        <th scope="col">Action</th>
      </tr>
    </thead>
    <tbody>
        {stock.map(s => {
     return <tr>
         <th scope="row">{s.package_}</th>
         <td><div className="pill pill-danger">{s.status}</div></td>
         <td>{s.pretty}</td>
         <td>{s.ussd}</td>
         <td>{s.ocr}</td>
         <td>{s.created["@ts"]}</td>
         <td>show-image-here</td>
        <td><a href="/#"><i class="fa bi-times text-danger"></i> Delete</a></td>
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

    let [apiKey, setApiKey] = useState(config.admin.getApiKey())
    

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
                    <AddStock />
                </div>

            </section>

        </>
    )
}