import * as React from "react";
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
// @ts-ignore
import styles from "./Wavesurfer.module.css";
import {formatPlaybackTime} from "../../util/TimeUtils";
import {fetchRegions} from "../../util/FetchUtils";
import {Region} from "../../types/Region";
import ColorMap from "../../util/ColorMap";

interface WavesurferProps {
    songUrl: string;
    taskId: string;
}

interface WavesurferState {
    playbackPos: number;
    playbackStarted: boolean;
    pieceDuration: string;
    currentTime: string;
    regions: Array<Region>;
}

export class Wavesurfer extends React.Component <WavesurferProps, WavesurferState> {

    private wavesurfer: WaveSurfer | undefined;
    private playbackPosInterval: any;
    private mouseDownPos: number = 0;
    private drawingInterval: boolean = false;


    constructor(props: WavesurferProps) {
        super(props);
        this.state = {
            playbackPos: 0,
            playbackStarted: false,
            pieceDuration: "",
            currentTime: "",
            regions: []
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
                /* SpectrogramPlugin.create({
                    container: '#spectrogram'
                }),*/
                RegionsPlugin.create({
                    enableDragSelection: true
                })
            ]
        });

        this.wavesurfer.load(this.props.songUrl);

        this.wavesurfer.on("ready", async () => {
            this.wavesurfer && this.setState({
                pieceDuration: formatPlaybackTime(Math.ceil(this.wavesurfer.getDuration() * 1000))
            });
            try {
                let regions = await fetchRegions(this.props.taskId);
                console.log(regions);

                let regionArr = [];
                for (let i = 0; i < regions.length; i++) {
                    let region = regions[i];
                    let newRegion: Region = {
                        id: i,
                        start: region.start_time,
                        end: region.end_time,
                        annotation: region.annotation
                    };

                    let currentRegionOptions = {
                        start: newRegion.start,
                        end: newRegion.end,
                        color: ColorMap.get(newRegion.annotation)
                    };
                    this.wavesurfer && this.wavesurfer.addRegion(currentRegionOptions);
                    regionArr.push(newRegion);
                }
                this.setState({
                    regions: regionArr
                });
            } catch (e) {
                console.error(e);
            }
        });
    }

    private togglePlayback = () => {
        if (this.wavesurfer) {
            if (this.wavesurfer.isPlaying()) {
                this.wavesurfer.pause();
                clearInterval(this.playbackPosInterval);
                this.setState({
                    playbackStarted: false
                });
            } else {
                this.wavesurfer.play();
                this.setState({
                    playbackStarted: true
                })
                this.playbackPosInterval = setInterval(this.updatePlaybackPosition.bind(this), 500);
            }
        }
    }

    private updatePlaybackPosition = () => {
        if (this.wavesurfer) {
            let currentPos = this.wavesurfer.getCurrentTime();
            this.setState({
                currentTime: formatPlaybackTime(Math.ceil(currentPos * 1000))
            })
        }

    }

    private onMouseDown = (ev: any) => {

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
        if (this.mouseDownPos === ev.clientX) {
            this.drawingInterval = false;
            if (this.wavesurfer) {
                let currentPos = this.mouseDownPos / this.wavesurfer.drawer.getWidth();
                this.wavesurfer.seekTo(currentPos);

                if (!this.wavesurfer.isPlaying()) {
                    clearInterval(this.playbackPosInterval);
                    this.wavesurfer.play();
                    this.playbackPosInterval = setInterval(this.updatePlaybackPosition.bind(this), 500);
                }

                this.setState({
                    playbackStarted: true,
                    currentTime: formatPlaybackTime(Math.ceil(currentPos * this.wavesurfer.getDuration() * 1000))
                })
            }

        } else {
            // mouse position changed, that means that we have to end a region
        }
    }

    public render() {
        return (<>
            <div id="spectrogram">
            </div>
            <div id="waveform"
                 onMouseDown={this.onMouseDown.bind(this)}
                 onMouseUp={this.onMouseUp.bind(this)}
                 onMouseMove={this.onMouseMove.bind(this)}></div>

            <div className={styles.playerButtons}>
                <div className={styles.playButton}
                     onClick={this.togglePlayback.bind(this)}>
                    {!this.state.playbackStarted ? "play" : "pause"}
                </div>
                <div>{this.state.currentTime + "/" + this.state.pieceDuration}</div>
            </div>
        </>);
    }
}
