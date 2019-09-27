export function fetchRegions(taskId: string): Promise<any> {
    let pr: Promise<any> = new Promise((resolve, reject) => {
        fetch("http://pn-rect.dyn-vpn.de:3002/annotation?taskId=" + taskId)
            .then(data => {
                data.json().then((result: any) => {
                    resolve(result);
                });
            })
            .catch(error => {
                reject(error);
            });
    });

    return pr;
}
