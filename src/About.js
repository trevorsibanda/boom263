


export default function About(props) {
    return (
          <main id="main" style={{marginTop:"100px"}}>

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-5 col-lg-3">
            <img src="assets/img/about-img.png" alt="About" data-aos="zoom-in" data-aos-delay="100" />
          </div>

          <div className="col-md-7 col-lg-5">
            <div className="about-content" data-aos="fade-left" data-aos-delay="100">

              <h2><span>Boom 263</span> </h2>
              <p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
                ad
                minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat
              </p>

              <ul className="list-unstyled">
                <li><i className="vi bi-chevron-right"></i>Creative Design</li>
                <li><i className="vi bi-chevron-right"></i>Retina Ready</li>
                <li><i className="vi bi-chevron-right"></i>Easy to Use</li>
                <li><i className="vi bi-chevron-right"></i>Unlimited Features</li>
                <li><i className="vi bi-chevron-right"></i>Unlimited Features</li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}