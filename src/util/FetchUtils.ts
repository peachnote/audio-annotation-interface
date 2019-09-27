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

export function submitAnnotations(taskId: string, annotations: Array<any>, grades: Array<any>) {
    let pr: Promise<any> = new Promise((resolve, reject) => {
        fetch("http://pn-rect.dyn-vpn.de:3002/evaluation",
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        taskId: taskId,
                        userId: 3,
                        grades: grades,
                        annotations: annotations
                    })
            }).then((result:any)=>{
                resolve(result);
        }).catch((error)=>{
            reject(error);
        });
    });
}
