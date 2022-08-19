
export async function getIP() {
    fetch('https://hutils.loxal.net/whois')
        .then((response) => response.json())
            .then((data) => console.log(data.ip));
}   