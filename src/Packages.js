import { Link } from "react-router-dom"
import config from "./config"
import Money from "./Money"


function Package(props) {
    return (
          <div className="col-md-6 col-lg-4">
            <div className="block-pricing">
              <div className="pricing-table">
                <h4>{props.p.provider}</h4>
                <h2><Money value={props.p.amount} /></h2>
                <ul className="list-unstyled">
                        {props.p.features.map((feat, idx) => {
                            return <li key={idx}>{feat}</li>
                        })
                        }
                    <li>Save up to 15% compared to buying using DerivP2P</li>
              <li>Pay only <Money value={config.pkg_price(props.p.amount)} /></li>
                </ul>
                <div className="table_btn">
                    <Link to={"/buy/" + props.p.id} className="btn"><i className="bi bi-cart"></i> Buy now</Link>
                </div>
              </div>
            </div>
          </div>

    )
}


export default function Packages(props) {
    return (
    <section id="pricing" className="padd-section text-cente">

      <div className="container" data-aos="fade-up">
        <div className="section-title text-center">

          <h2>We have you covered with our range of products.</h2>
          <p className="separator">We offer the best prices in the market to suit everyone's needs.</p>
        </div>

        <div className="row" data-aos="fade-up" data-aos-delay="100">
                    {config.packages.map(p => {
                return <Package p={p} />
            })}

        </div>
      </div>
    </section>

    )
}