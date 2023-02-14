import { useState } from 'react';
import './App.css';
import config from './config';
import Hero from './Hero';
import Packages from './Packages';

function App(props) {


  let [userHeader] = useState("Hello, "+ config.localUser().fullname + "! Welcome to Boom263")

  return (
    <>
      <Hero />
      <Packages header={userHeader} />
    </>
  );
}

export default App;
