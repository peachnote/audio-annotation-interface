import {Wavesurfer} from "../wavesurfer/Wavesurfer";
import React from "react"
// @ts-ignore
import {withAuthenticator} from 'aws-amplify-react';
import {Auth} from "aws-amplify";

import styles from "./Annotator.module.css";

interface AnnotatorState {
    userId: string;
    currentTaskId: string;
    currentTaskUrl: string;
}

class Annotator extends React.Component <any, AnnotatorState> {

    async componentDidMount() {
        const identityId = await (await Auth.currentCredentials()).identityId;

        /* Auth.currentAuthenticatedUser()
            .then(user => {
                console.log(user);
                this.setState({user});
            }); */

        console.log('Returned info: ', identityId);
        this.setState({userId: identityId});


    }

    public render() {
        return (<div className={styles.annotator}>
            <Wavesurfer
                taskId={this.state.currentTaskId}
                songUrl={this.state.currentTaskUrl}/>
        </div>);
    }
}

export default withAuthenticator(Annotator);
