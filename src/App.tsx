import React from 'react';
import './App.css';
import {Wavesurfer} from "./components/wavesurfer/Wavesurfer";
import Amplify from 'aws-amplify';
// import awsconfig from './aws-exports';
// import { withAuthenticator } from 'aws-amplify-react';

// Amplify.configure(awsconfig);

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
