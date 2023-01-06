import { useEffect, useState} from "react"
import { Navigate } from "react-router"
import config from "./config"



export default function Login() {

  let [loggedIn, setLoggedIn] = useState(false)
  let [working, setWorking] = useState(true)


  useEffect(() => {
    let params = config.urlParams()
    if (params && params.acct1 && params.token1 && params.cur1 && params.cur1.toLowerCase() === "usd") {
      config.storeDerivToken(params.cur1, params.acct1, params.token1)
    } else if (params && params.acct2 && params.token2 && params.cur2 && params.cur2.toLowerCase() === "usd") {
      config.storeDerivToken(params.cur2, params.acct2, params.token2)
    } else if (params && params.acct3 && params.token3 && params.cur3 && params.cur3.toLowerCase() === "usd") {
      config.storeDerivToken(params.cur3, params.acct3, params.token3)
    } else if (params && params.acct4 && params.token4 && params.cur4 && params.cur4.toLowerCase() === "usd") {
      config.storeDerivToken(params.cur4, params.acct4, params.token4)
    } else if (params && params.acct5 && params.token5 && params.cur5 && params.cur5.toLowerCase() === "usd") {
      config.storeDerivToken(params.cur5, params.acct5, params.token5)
    } else if (params && params.acct6 && params.token6 && params.cur6 && params.cur6.toLowerCase() === "usd") {
      config.storeDerivToken(params.cur6, params.acct6, params.token6)
    } else {
      config.clearDerivToken()
      alert("Invalid login parameters", "Please login again or choose a different account, we failed to find a USD account to use", "error")
    }

    let token = config.derivAuthToken()
    if (token && token.token) {
      //todo: connect and authenticate using deriv api
      setLoggedIn(true)

      config.checkLoggedInRemote().then((res) => {
        if (res.error) {
          alert("Failed to login", res.error, "error")
          setLoggedIn(false)
          setWorking(false)
          return
        }
        if (res.ok) {
          setLoggedIn(true)
          setWorking(false)
        }
      }).catch(console.log)
      
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
