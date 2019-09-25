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
    pieceDuration: number; // in seconds
    currentTime: number;   // in seconds
    regions: Array<Region>;
}

export class Wavesurfer extends React.Component <WavesurferProps, WavesurferState> {

    private wavesurfer: WaveSurfer | undefined;
    private playbackPosInterval: any;
    private mouseDownPos: number = -1;
    private drawingInterval: boolean = false;


    constructor(props: WavesurferProps) {
        super(props);
        this.state = {
            playbackPos: 0,
            playbackStarted: false,
            pieceDuration: 0,
            currentTime: 0,
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
                pieceDuration: this.wavesurfer.getDuration()
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
                    regionArr.push(newRegion);
                }
                this.setState({
                    regions: regionArr
                });

                this.renderRegions();

            } catch (e) {
                console.error(e);
            }
        });

        this.wavesurfer.on("finish", () => {
            clearInterval(this.playbackPosInterval);
            this.setState({
                playbackStarted: false
            })
        })
    }

    private renderRegions = () => {
        for (let region of this.state.regions) {
            let currentRegionOptions = {
                start: region.start,
                end: region.end,
                color: ColorMap.get(region.annotation)
            };
            this.wavesurfer && this.wavesurfer.addRegion(currentRegionOptions);
        }

        // TODO: UPDATE REGION LABELS/TOOLTIPS
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
                });
                this.playbackPosInterval = setInterval(this.updatePlaybackPosition.bind(this), 500);
            }
        }
    }

    private updatePlaybackPosition = () => {

        if (this.wavesurfer) {
            this.setState({
                currentTime: this.wavesurfer.getCurrentTime()
            })
        }

    };

    private onMouseDown = (ev: any) => {
        if (this.wavesurfer) {
            this.mouseDownPos = ev.clientX;
            // console.log(ev.clientX, this.wavesurfer && this.wavesurfer.drawer.width);
            let currentPos = (ev.clientX + this.wavesurfer.drawer.getScrollX()) / this.wavesurfer.drawer.width * this.wavesurfer.getDuration();
            this.wavesurfer && console.log("Mouse down at " + currentPos);
            this.drawingInterval = true;
        }
    };

    private onMouseMove = (ev: any) => {
        // console.log(ev.clientX);

        if (this.drawingInterval) {

        }
    };

    private onMouseUp = (ev: any) => {
        this.drawingInterval = false;
        if (this.wavesurfer) {
            // we are in the same position where the mouse was put down, d.h. clicked
            if (this.mouseDownPos === ev.clientX) {
                console.log(this.wavesurfer.drawer.getWidth());
                let currentPos = this.mouseDownPos / this.wavesurfer.drawer.getWidth();
                console.log(currentPos);
                // this.wavesurfer.seekTo(currentPos);

                if (!this.wavesurfer.isPlaying()) {
                    clearInterval(this.playbackPosInterval);
                    this.wavesurfer.play();
                    this.playbackPosInterval = setInterval(this.updatePlaybackPosition.bind(this), 500);
                }

                this.setState({
                    playbackStarted: true,
                    currentTime: currentPos * this.wavesurfer.getDuration()
                })


            } else {
                // mouse position changed, that means that we have to end a region

                 let startTime = (this.mouseDownPos+this.wavesurfer.drawer.getScrollX()) / this.wavesurfer.drawer.width * this.state.pieceDuration
                 let endTime = (ev.clientX+this.wavesurfer.drawer.getScrollX()) / this.wavesurfer.drawer.width * this.state.pieceDuration;
                let newRegionOptions = {
                      start: startTime,
                      end: endTime,
                      color: "rgba(0,0,255,0.5)"
                  };
                  this.wavesurfer.addRegion(newRegionOptions);
                  console.log(this.wavesurfer.regions.list);
                  this.mouseDownPos = -1;
            }
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
                <div>{formatPlaybackTime(Math.ceil(this.state.currentTime * 1000)) + "/" + formatPlaybackTime(Math.ceil(this.state.pieceDuration * 1000))}</div>
            </div>
        </>);
    }
}
