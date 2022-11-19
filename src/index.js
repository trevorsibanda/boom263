import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';


import reportWebVitals from './reportWebVitals';
import Packages from './Packages';
import Navbar from './Navbar';
import Footer from './Footer';
import Buy from './Buy';
import AccountPicker from './MyOrders';
import MyOrders from './MyOrders';
import Order from './Order';
import About from './About';
import ScrollToTop from './ScrollToTop';
import Login from './Login';


function Boom263(){
    return (
      <BrowserRouter>
        
          <Navbar />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/about" element={<About />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/login" element={<Login />} />
            <Route path="/buy/:package_" element={<Buy />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/order/verify" element={<Order />} />
            
            <Route path="/order/:id" element={<Order />} />
            
            <Route path="*" element={<Page404 />}/>
          </Routes>
          <Footer />
        
      </BrowserRouter> 
    )
}

let nativeAlert = window.alert
window.alert = (title, text, mode, timer) => {
  if (window.Swal) {
    window.Swal.fire({title, text, icon: mode, timer})
  } else {
    nativeAlert(mode + ":"+ title + "\n\n"+text)
  }
  
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Boom263 />
);


function Page404(props) {
    return (
          <main id="main" style={{marginTop:"100px"}}>

    <section id="about-us" className="about-us padd-section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">

          
          <div className="col-md-12 col-lg-12">
            <h4 class="text-center">Page not Found - Error 404</h4>
          </div>
          <div className="col-md-12 col-lg-12">
            <img src="assets/img/404.jpg" alt="Pre loader" data-aos="zoom-in" data-aos-delay="100" />
          </div>

        </div>
      </div>
    </section>
  </main>
    )    
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
