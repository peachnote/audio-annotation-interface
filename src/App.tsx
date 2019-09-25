import React from 'react';
import './App.css';
import {Wavesurfer} from "./components/wavesurfer/Wavesurfer";

const App: React.FC = () => {
  return (
    <div className="App">
      <Wavesurfer
          taskId="26"
          songUrl="https://spotify.tuttitempi.com/data/audio-evaluation/26.mp3"/>
    </div>
  );
}

export default App;
