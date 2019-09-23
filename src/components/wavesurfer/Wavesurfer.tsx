import * as React from "react";
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';

interface WavesurferProps {
    songUrl: string
}

export class Wavesurfer extends React.Component <WavesurferProps, any> {

    private wavesurfer: WaveSurfer|undefined;

    public componentDidMount(): void {
        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: 'violet',
            progressColor: 'purple',
            scrollParent: true,
            height: window.innerHeight/2,
            barHeight: window.innerHeight/100,
            plugins: [
                RegionsPlugin.create()
            ]
        });

        this.wavesurfer.load(this.props.songUrl);

        this.wavesurfer.on("ready", ()=> {
            console.log("ready");
            console.log( this.wavesurfer && this.wavesurfer.drawer.width);
        });
    }

    private onClick = (ev: any) => {
        // console.log(ev.clientX);
    }

    private onStartedDrawing = (ev: any) => {
        console.log(ev);
        console.log(ev.clientX);
        console.log(this.clickedOnScrollbar(ev.clientY));
    }

    private clickedOnScrollbar = (mouseY: number) => {
        if (this.wavesurfer && this.wavesurfer.drawer.outerHeight <= mouseY ){
            return true;
        }
    }

    private onEndedDrawing = (ev: any) => {
        console.log(ev.clientX);
    }

    public render () {
        return (<div id="waveform" onClick={this.onClick.bind(this)}
        onMouseDown={this.onStartedDrawing.bind(this)}
        onMouseUp={this.onEndedDrawing.bind(this)}></div>);
    }
}
