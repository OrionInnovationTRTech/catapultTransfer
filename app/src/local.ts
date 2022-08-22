
export async function getIP(socket: any) {
    const publicIP = await fetch('https://hutils.loxal.net/whois')
                        .then((response) => response.json())
                            .then((data) => data.ip);

    socket.emit('local', publicIP);
}