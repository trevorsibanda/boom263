import config from "./config"
import Loader from "./Loader"

function takeMeTo(url) {
  setTimeout(_ => {
    window.location.href = url
  }, 1000)
}


export default function About(props) {

  if (props.whatsapp === true) {
      console.log(props)
      takeMeTo(config.whatsappURI)
      return <Loader text="Opening Whatsapp chat" />
  }
  if (props.tnc === true) {
    takeMeTo(config.derivTnc)
    return <Loader text="Taking you to deriv terms and conditions" />
  }

    return (
          <main id="main" style={{marginTop:"100px"}}>

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-5 col-lg-3">
            <img src="/assets/img/banner.gif" alt="About" data-aos="zoom-in" data-aos-delay="100" />
          </div>

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

              <h2><span>Boom 263</span> </h2>
                  <p>
                    Boom263 is an online platform that allows you to buy and sell airtime, data bundles, electricity tokens and do more.
                    We support the following payment methods:
                    <ul>
                      <li>Deriv</li>
                      <li>InnBucks <sup><b>Coming soon</b></sup></li>
                    </ul>
                    <br />
                    For more information, please contact us by <a href={config.whatsappURI}>Email or WhatsApp</a>
              </p>

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i>Secure payments through trusted service providers</li>
                <li><i className="vi bi-chevron-right"></i>Use anytime</li>
                <li><i className="vi bi-chevron-right"></i>Competitve prices on all services offered</li>
                <li><i className="vi bi-chevron-right"></i>Easy to use</li>
                <li><i className="vi bi-chevron-right"></i>Get support for any problems</li>
                <li><a href={config.whatsappURI} class="btn btn-success btn-block" >Talk to us on Whatsapp</a></li>
                <li><a  href={"mailto:" + config.supportEmail} class="btn btn-primary btn-block" >Send us an email</a></li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}