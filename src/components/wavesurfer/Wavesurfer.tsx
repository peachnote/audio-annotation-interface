import * as React from "react";
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
// @ts-ignore
import styles from "./Wavesurfer.module.css";
import {formatPlaybackTime} from "../../util/TimeUtils";
import {fetchRegions, submitAnnotations} from "../../util/FetchUtils";
import ColorMap from "../../util/ColorMap";
import {annotationTypes} from "../../util/AnnotationType";

interface WavesurferProps {
    songUrl: string;
    taskId: string;
    userId: string;
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
    removeButtons: Array<JSX.Element>;
}

export class Wavesurfer extends React.Component <WavesurferProps, WavesurferState> {

    private wavesurfer: WaveSurfer | undefined;
    private playbackPosInterval: any;
    private regionFetchedFromServer: boolean = false;


    constructor(props: WavesurferProps) {
        super(props);
        this.state = {
            playbackPos: 0,
            playbackStarted: false,
            pieceDuration: 0,
            currentTime: 0,
            regions: {},
            currentRegion: null,
            removeButtons: []
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
                /*SpectrogramPlugin.create({
                    container: "#wave-spectrogram",
                    windowFunc: 'bartlett',
                    pixelRatio: 1
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


            this.wavesurfer && this.wavesurfer.on("seek", () => {
                if (this.wavesurfer) {
                    this.setState({
                        currentTime: this.wavesurfer.getCurrentTime()
                    })
                }
            });

            this.wavesurfer && this.wavesurfer.on("finish", () => {
                clearInterval(this.playbackPosInterval);
                this.setState({
                    playbackStarted: false
                })
            });

            this.wavesurfer && this.wavesurfer.on("region-created", (region) => {

                if (this.wavesurfer) {

                    // remove the previous region that wasn't annotated upon creation of new one
                    for (let regionId in this.state.regions) {
                        let cRegion = this.state.regions[regionId];
                        if (cRegion.annotation === "") {
                            console.log("Region with empty annotation", regionId);

                            for (let innerRegionId in this.wavesurfer.regions.list) {
                                if (innerRegionId === regionId) {
                                    console.log("Removing region " + innerRegionId, this.wavesurfer.regions.list[innerRegionId]);
                                    this.wavesurfer.regions.list[innerRegionId].remove();
                                }
                            }

                            delete this.state.regions[regionId];

                        }
                    }


                    // if this is a region that was just created manually or received from server,
                    // we need to put it into the regions maps
                    if (!this.state.regions[region.id]) {

                        let regionMap = this.state.regions;
                        let newRegion = {
                            region: region,
                            annotation: ""
                        };
                        console.log("created new region" + region.id + " with annotation", newRegion.annotation);

                        regionMap[region.id] = newRegion;


                        if (this.regionFetchedFromServer) {
                            this.regionFetchedFromServer = false;
                            this.setState({
                                regions: regionMap,
                            });
                        } else {
                            this.setState({
                                regions: regionMap,
                                currentRegion: region
                            });
                        }
                    }
                    console.log(this.state.currentRegion);
                }
            });

            this.wavesurfer && this.wavesurfer.on("region-updated", (region) => {
                this.state.regions[region.id].region = region;

                if (this.state.currentRegion && region.id === this.state.currentRegion.id) {
                    this.setState({
                        currentRegion: region
                    })
                }
            });

            this.wavesurfer && this.wavesurfer.on("region-click", (region) => {
                this.setState({
                    currentRegion: region
                })
            });
        });
    }

    public componentWillReceiveProps(nextProps: Readonly<WavesurferProps>, nextContext: any): void {
        if (nextProps.userId!==this.props.userId && nextProps.userId!=="") {
            this.fetchRegionsForUser(nextProps.userId)
        }
    }

    private async fetchRegionsForUser (userId: string) {
        try {
            let regions = await fetchRegions(this.props.taskId, userId);
            console.log(regions);

            for (let i = 0; i < regions.length; i++) {
                let region = regions[i];
                let newRegion = {
                    start: region.start_time,
                    end: region.end_time,
                    color: ColorMap.get(region.annotation)
                };
                if (this.wavesurfer) {
                    this.regionFetchedFromServer = true;
                    let added = this.wavesurfer.addRegion(newRegion);
                    let addedId: string = added.id;
                    let annotatedRegion = new AnnotatedRegion();
                    annotatedRegion.region = added;
                    annotatedRegion.annotation = region.annotation;
                    console.log("Setting region" + addedId, annotatedRegion);
                    let updatedRegions = this.state.regions;
                    updatedRegions[addedId] = annotatedRegion;
                    this.setState({
                        regions: updatedRegions
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
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
        // console.log(this.state.currentRegion && this.state.currentRegion.start, this.state.currentRegion && this.state.currentRegion.end);

        return (<>

            <div id="waveform" className={styles.waveform}>
            </div>

            {this.state.currentRegion &&
            <div className={styles.currentRegion}>
                Selected
                region: {formatPlaybackTime(Math.ceil(this.state.currentRegion.start * 1000))}-{formatPlaybackTime(Math.ceil(this.state.currentRegion.end * 1000))}
                <div className={styles.removeButton}

                     onClick={() => {
                         let idToRemove = this.state.currentRegion.id;
                         this.state.currentRegion.remove();
                         delete this.state.regions[idToRemove];
                         this.setState({
                             currentRegion: null
                         });
                     }}>remove
                </div>
            </div>}

            <div className={styles.playerButtons}>
                <div className={styles.playButton}
                     onClick={this.togglePlayback.bind(this)}>
                    {!this.state.playbackStarted ? <p>&#9654;</p> : <p>&#9632;</p>}
                </div>
                <div>{formatPlaybackTime(Math.ceil(this.state.currentTime * 1000)) + "/" + formatPlaybackTime(Math.ceil(this.state.pieceDuration * 1000))}</div>
            </div>


            <div className={styles.annotationButtons}>
                {annotationTypes.map((annotationType) => {
                    return (<div
                        key={annotationType}
                        className={styles.annotationButton}
                        style={{
                            backgroundColor: ColorMap.get(annotationType),
                            opacity: this.state.currentRegion ? 1 : 0.5,
                            cursor: this.state.currentRegion ? "pointer" : "unset"
                        }} onClick={() => {
                        if (this.wavesurfer && this.state.currentRegion) {
                            this.state.currentRegion.update({
                                color: ColorMap.get(annotationType)
                            });

                            let currentRegion = this.state.regions[this.state.currentRegion.id];
                            if (currentRegion) {
                                currentRegion.annotation = annotationType;
                            }
                        }

                    }}>{annotationType}</div>);
                })}
            </div>

            <div className={styles.persistenceButtons}>
                <div className={styles.persistButton}
                     onClick={async () => {
                         try {
                             let grades = [
                                 {parameter: "smoothness", value: Math.floor(Math.random() * 100)},
                                 {parameter: "rhythm", value: Math.floor(Math.random() * 100)},
                                 {parameter: "pitch", value: Math.floor(Math.random() * 100)},
                                 {parameter: "hands coordination", value: Math.floor(Math.random() * 100)},
                                 {parameter: "expression", value: Math.floor(Math.random() * 100)}
                             ];

                             let annotations: Array<any> = [];

                             let emptyRegion = false;
                             for (let region in this.state.regions) {
                                 if (this.state.regions[region].annotation === "") {
                                     alert("Empty annotation!")
                                     return;
                                 }

                                 let annotationObj = {
                                     annotation: this.state.regions[region].annotation,
                                     start: this.state.regions[region].region.start,
                                     end: this.state.regions[region].region.end
                                 };

                                 annotations.push(annotationObj);
                             }

                             console.log(annotations);

                             let result = await submitAnnotations(this.props.taskId,
                                 annotations, grades, this.props.userId);
                             alert("annotations submitted");
                         } catch (e) {
                             alert("error submitting annotations");
                             console.log(e);
                         }
                     }}>save annotations
                </div>
            </div>
        </>);
    }
}
