import {Wavesurfer} from "../wavesurfer/Wavesurfer";
import React from "react"
// @ts-ignore
import {withAuthenticator} from 'aws-amplify-react';
import {Auth} from "aws-amplify";

import styles from "./Annotator.module.css";
import {fetchUserId} from "../../util/FetchUtils";

interface AnnotatorState {
    userId: string;
    currentTaskId: string;
    currentTaskUrl: string;
}

class Annotator extends React.Component <any, AnnotatorState> {

    constructor(props: any) {
        super(props);
        this.state = {
            userId: "",
            currentTaskId: "26",
            currentTaskUrl: "https://spotify.tuttitempi.com/data/audio-evaluation/26.mp3"
        }
    }

    async componentDidMount() {
        const identityId = await (await Auth.currentCredentials()).identityId;
        let userName = "";
        Auth.currentAuthenticatedUser()
            .then(async (user) => {
                userName = user.attributes.email;
                // let userId
                let resp = await fetchUserId(identityId, userName);
                resp.json().then((res: any) => {
                    let userId = res.id;
                    console.log("Received user id for cognito id", identityId, userId);
                    this.setState({
                        userId: userId
                    });
                });

            });
   }

    public render() {
        return (<div className={styles.annotator}>
            <Wavesurfer
                taskId={this.state.currentTaskId}
                songUrl={this.state.currentTaskUrl}
                userId={this.state.userId}/>
        </div>);
    }
}

export default withAuthenticator(Annotator);
