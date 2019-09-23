export function formatPlaybackTime(time: number): string {
    const milliseconds = time % 1000;
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

    let hoursStr;
    if (hours > 0) {
        hoursStr = (hours < 10) ? "0" + hours : hours;
    } else {
        hoursStr = "";
    }
    const minutesStr = (minutes < 10) ? "0" + minutes : minutes;
    const secondsStr = (seconds < 10) ? "0" + seconds : seconds;

    return hoursStr + (hoursStr === "" ? "" : ":") + minutesStr + ":" + secondsStr;
}
