


export default function Loader(props) {
    return (
          <main id="main" style={{marginTop:"100px"}}>

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          <div className="col-md-12 col-lg-12">
            <img src="/assets/img/loader.gif" alt="Pre loader" data-aos="zoom-in" data-aos-delay="100" />
          </div>
          <div className="col-md-12 col-lg-12">
                <h4 className="text-center">{props.text ? props.text : "Working, Please wait..."}</h4>
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}