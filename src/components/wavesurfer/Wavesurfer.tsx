import * as React from "react";
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
// @ts-ignore
import styles from "./Wavesurfer.module.css";
import {formatPlaybackTime} from "../../util/TimeUtils";
import {fetchRegions} from "../../util/FetchUtils";
import ColorMap from "../../util/ColorMap";
import {annotationTypes} from "../../util/AnnotationType";

interface WavesurferProps {
    songUrl: string;
    taskId: string;
}

class AnnotatedRegion {
    public region: any;
    public annotation: string = "";
}

interface WavesurferState {
    playbackPos: number;
    playbackStarted: boolean;
    pieceDuration: number; // in seconds
    currentTime: number;   // in seconds
    regions: any;
    currentRegion: any;
}

export class Wavesurfer extends React.Component <WavesurferProps, WavesurferState> {

    private wavesurfer: WaveSurfer | undefined;
    private playbackPosInterval: any;


    constructor(props: WavesurferProps) {
        super(props);
        this.state = {
            playbackPos: 0,
            playbackStarted: false,
            pieceDuration: 0,
            currentTime: 0,
            regions: {},
            currentRegion: null
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
                    dragSelection: true
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

                for (let i = 0; i < regions.length; i++) {
                    let region = regions[i];
                    let newRegion = {
                        start: region.start_time,
                        end: region.end_time,
                        color: ColorMap.get(region.annotation)
                    };
                    if (this.wavesurfer) {
                        let added = this.wavesurfer.addRegion(newRegion);
                        let addedId: string = added.id;
                        let annotatedRegion = new AnnotatedRegion();
                        annotatedRegion.region = added;
                        annotatedRegion.annotation = region.annotation;
                        this.state.regions[addedId] = annotatedRegion;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });

        this.wavesurfer.on("finish", () => {
            clearInterval(this.playbackPosInterval);
            this.setState({
                playbackStarted: false
            })
        });

        this.wavesurfer.on("region-created", (region) => {

            if (this.wavesurfer) {

                for (let regionId in this.state.regions) {
                    let cRegion = this.state.regions[regionId];
                    if (cRegion.annotation === "") {
                        console.log("Region with empty annotation", regionId);

                        for (let innerRegionId in this.wavesurfer.regions.list) {
                            if (innerRegionId === regionId) {
                                console.log("Removing region "+innerRegionId, this.wavesurfer.regions.list[innerRegionId]);
                                this.wavesurfer.regions.list[innerRegionId].remove();
                            }
                        }

                        delete this.state.regions[regionId];

                    }
                }

                if (!this.state.regions[region.id]) {

                    let regionMap = this.state.regions;

                    regionMap[region.id] = {
                        region: region,
                        annotation: ""
                    };

                    this.setState({
                        regions: regionMap,
                        currentRegion: region
                    });
                }
                console.log(this.state.regions, this.wavesurfer.regions.list);
            }
        });

        this.wavesurfer.on("region-updated", (region) => {
            this.state.regions[region.id].region = region;
        });

        this.wavesurfer.on("region-dblclick", (region) => {
            this.setState({
                currentRegion: region
            })
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

    public render() {
        return (<>
            <div id="spectrogram">
            </div>
            <div id="waveform"
                // onMouseDown={this.onMouseDown.bind(this)}
                // onMouseUp={this.onMouseUp.bind(this)}
                // onMouseMove={this.onMouseMove.bind(this)}
            ></div>

            <div className={styles.playerButtons}>
                <div className={styles.playButton}
                     onClick={this.togglePlayback.bind(this)}>
                    {!this.state.playbackStarted ? "play" : "pause"}
                </div>
                <div>{formatPlaybackTime(Math.ceil(this.state.currentTime * 1000)) + "/" + formatPlaybackTime(Math.ceil(this.state.pieceDuration * 1000))}</div>
            </div>

            <div className={styles.annotationButtons}>
                {annotationTypes.map((annotationType) => {
                    return (<div key={annotationType} className={styles.annotationButton} style={{
                        backgroundColor: ColorMap.get(annotationType)
                    }} onClick={() => {
                        if (this.wavesurfer && this.state.currentRegion) {
                            this.state.currentRegion.update({
                                color: ColorMap.get(annotationType)
                            });

                            let currentRegion = this.state.regions[this.state.currentRegion.id];
                            if (currentRegion) {
                                console.log(currentRegion);
                                currentRegion.annotation = annotationType;
                                this.state.regions[currentRegion.region.id] = currentRegion;
                            }

                            console.log(this.state.regions);
                        }

                    }}>{annotationType}</div>);
                })}
            </div>
        </>);
    }
}


/*
    private onMouseDown = (ev: any) => {
        if (this.wavesurfer && (ev.clientY < this.wavesurfer.drawer.canvases[0].wave.offsetHeight)) {
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

        // checking wavesurfer to satisfy js, checking if we didn't click scrollbar
        if (this.wavesurfer && (ev.clientY < this.wavesurfer.drawer.canvases[0].wave.offsetHeight)) {

            // we are in the same position where the mouse was put down, d.h. clicked
            if (this.mouseDownPos === ev.clientX) {

                if (!this.wavesurfer.isPlaying()) {
                    clearInterval(this.playbackPosInterval);
                    this.wavesurfer.play();
                    this.playbackPosInterval = setInterval(this.updatePlaybackPosition.bind(this), 500);
                }

                this.setState({
                    playbackStarted: true
                })


            } else {
                // mouse position changed, that means that we have to end a region
                /*
                                let startTime = (this.mouseDownPos + this.wavesurfer.drawer.getScrollX()) / this.wavesurfer.drawer.width * this.state.pieceDuration
                                let endTime = (ev.clientX + this.wavesurfer.drawer.getScrollX()) / this.wavesurfer.drawer.width * this.state.pieceDuration;
                                let newRegionOptions = {
                                    start: startTime,
                                    end: endTime,
                                    color: "rgba(0,0,255,0.5)"
                                };
                                this.wavesurfer.addRegion(newRegionOptions);

                                let newRegion = {
                                    start: startTime,
                                    end: endTime,
                                    id: this.state.regions.length,
                                    annotation: ""
                                };

                                let newRegions = Array.from(this.state.regions);

                                newRegions.push(newRegion);
                                this.setState({
                                    regions: newRegions,
                                    currentRegion: newRegion
                                })

                                this.mouseDownPos = -1;
            }
        }
    }
*/
