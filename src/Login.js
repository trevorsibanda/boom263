import { Component, useState } from "react"
import { Navigate } from "react-router"
import config from "./config"



export default class Login extends Component {

  constructor(props) {
    super(props)

    this.state = {
      checked: false,
    }

  }


  

  redir() {
    if (!config.checkLoggedIn()) {
      window.location.href = config.derivLoginURL()
      return <></>
    }
    return <Navigate to={config.postLogin()} />
    
    
  }

  render() {

    return (config.checkLoggedIn() || this.state.checked) ? this.redir() : (
      <main id="main" style={{ marginTop: "100px" }}>

        <section id="about-us" className="about-us padd-section">
          <div className="container" data-aos="fade-up">
            <div className="row justify-content-center">

              <div className="col-md-12 col-lg-12">
                <img src="assets/img/loader.gif" alt="Pre loader" data-aos="zoom-in" data-aos-delay="100" />
              </div>
              <div className="col-md-12 col-lg-12">
                <h4 className="text-center">Logging in with Deriv...</h4>
              </div>

            </div>
          </div>
        </section>
      </main>
    )
  }
}