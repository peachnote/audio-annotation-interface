import React from 'react';
import './App.css';
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';
import Annotator from "./components/annotator/Annotator";
// import { withAuthenticator } from 'aws-amplify-react';

Amplify.configure(awsconfig);

const App: React.FC = () => {
    return (
        <Annotator/>
    );
}

export default App;
