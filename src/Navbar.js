
import { Link } from "react-router-dom"
import config from "./config"

export default function Navbar(props) {
    return (
    <header id="header" className="header fixed-top d-flex align-items-center">
    <div className="container d-flex align-items-center justify-content-between">

      <div id="logo">
        <h1><Link to="/"><span>Boom</span>263</Link></h1>
      </div>

      <nav id="navbar" className="navbar">
        <ul>
          <li><Link className="nav-link scrollto active" to="/">Home</Link></li>
          <li className="dropdown"><a href="/"><span>Buy Airtime</span> <i className="bi bi-chevron-down"></i></a>
            <ul>
              { config.packages.map( pkg => 
                <li><Link to={"/buy/"+ pkg.id}>{pkg.name}</Link></li>  
                )
              }
              
            </ul>
          </li>
          <li><Link className="nav-link scrollto" to="/about">Help</Link></li>
        </ul>
        <i className="d-none bi bi-list mobile-nav-toggle"></i>
      </nav>
    </div>
  </header>
    )
}