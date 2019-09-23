import * as React from "react";
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
// @ts-ignore
import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram';
import styles from "./Wavesurfer.module.css";
import {formatPlaybackTime} from "../../util/TimeUtils";

interface WavesurferProps {
    songUrl: string
}

interface WavesurferState {
    playbackPos: number;
    playbackStarted: boolean;
    pieceDuration: string;
    currentTime: number;
}

export class Wavesurfer extends React.Component <WavesurferProps, WavesurferState> {

    private wavesurfer: WaveSurfer | undefined;
    private playbackPosInterval: any;
    private mouseDownPos: number=0;
    private drawingInterval: boolean=false;

    constructor(props: WavesurferProps) {
        super(props);
        this.state = {
            playbackPos: 0,
            playbackStarted: false,
            pieceDuration: "",
            currentTime: 0
        }


    }

    public componentDidMount(): void {
        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: 'violet',
            progressColor: 'purple',
            scrollParent: true,
            height: window.innerHeight / 2,
            barHeight: window.innerHeight / 100,
            plugins: [
                RegionsPlugin.create({
                    enableDragSelection: true
                }),
                SpectrogramPlugin.create({
                    container: '#waveform'
                })
            ]
        });

        this.wavesurfer.load(this.props.songUrl);

        this.wavesurfer.on("ready", () => {
            this.wavesurfer && this.setState({
                pieceDuration: formatPlaybackTime(Math.ceil(this.wavesurfer.getDuration()*1000))
            });
        });
    }

    private togglePlayback = () => {
        if (this.wavesurfer) {
            if (this.wavesurfer.isPlaying()) {
                this.wavesurfer.pause();
                this.setState({
                    playbackStarted: false
                });
            } else {
                this.wavesurfer.play();
                this.setState({
                    playbackStarted: true
                })
            }
        }
    }

    private onMouseDown = (ev: any) => {
        // console.log(ev);
        this.mouseDownPos = ev.clientX;
        this.drawingInterval = true;
    }

    private onMouseMove = (ev: any) => {
        // console.log(ev.clientX);

        if (this.drawingInterval) {

        }
    }

    private onMouseUp = (ev: any) => {

        // we are in the same position where the mouse was put down, d.h. clicked
        if (this.mouseDownPos===ev.clientX) {
            this.drawingInterval = false;
            if (this.wavesurfer) {
                let currentPos = this.mouseDownPos/this.wavesurfer.drawer.getWidth();
                this.wavesurfer.seekTo(currentPos);
            }
        } else {
            // mouse position changed, that means that we have to end a region
        }
    }

    public render() {
        return (<>
            <div id="waveform"
                 onMouseDown={this.onMouseDown.bind(this)}
                 onMouseUp={this.onMouseUp.bind(this)}
                 onMouseMove={this.onMouseMove.bind(this)}></div>
            <div id="spectrogram">
            </div>
            <div className={styles.playerButtons}>
                <div className={styles.playButton}
                     onClick={this.togglePlayback.bind(this)}>
                    {!this.state.playbackStarted ? "play" : "pause"}
                </div>
                <div>{this.state.currentTime+"/"+this.state.pieceDuration}</div>
            </div>
        </>);
    }
}
