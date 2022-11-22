import { useEffect, useState} from "react"
import { Navigate } from "react-router"
import config from "./config"



export default function Login() {

  let [loggedIn, setLoggedIn] = useState(false)
  let [working, setWorking] = useState(true)


  useEffect(() => {
    let params = config.urlParams()
    if (params && params.acct1 && params.token1 && params.cur1) {
      config.storeDerivToken(params.cur1, params.acct1, params.token1)
    }
    let token = config.derivAuthToken()
    if (token && token.token) {
      //todo: connect and authenticate using deriv api
      setLoggedIn(true)
    } else {
      setTimeout(_ => {
        setLoggedIn(false)
        setWorking(false)
      }, 1000)
    }
  }, [setLoggedIn, setWorking])

  let redir = ()=> {
    if (!loggedIn) {
      window.location.href = config.derivLoginURL()
      return <></>
    }
    return <Navigate to={config.postLogin()} />
    
    
  }

  return (loggedIn || !working) ? redir() : (
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
