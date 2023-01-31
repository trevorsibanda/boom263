


export default function About(props) {
    return (
          <main id="main" style={{marginTop:"100px"}}>

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-5 col-lg-3">
            <img src="/assets/banner.gif" alt="About" data-aos="zoom-in" data-aos-delay="100" />
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
                    For more information, please contact us by <a href="mailto:support@boom263.co.zw">Email or WhatsApp</a>
              </p>

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i>Secure payments through trusted service providers</li>
                <li><i className="vi bi-chevron-right"></i>Use anytime</li>
                <li><i className="vi bi-chevron-right"></i>Competitve prices on all services offered</li>
                <li><i className="vi bi-chevron-right"></i>Easy to use</li>
                <li><i className="vi bi-chevron-right"></i>Get support for any problems</li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}