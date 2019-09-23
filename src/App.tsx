import React from 'react';
import logo from './logo.svg';
import './App.css';
import {Wavesurfer} from "./components/wavesurfer/Wavesurfer";

const App: React.FC = () => {
  return (
    <div className="App">
      <Wavesurfer songUrl="https://spotify.tuttitempi.com/data/audio-evaluation/26.mp3"/>
    </div>
  );
}

export default App;
