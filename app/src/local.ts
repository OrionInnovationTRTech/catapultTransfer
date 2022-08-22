import { disconnect, joinRoom } from "./socket";

export async function localRoom(socket: any) {
    const publicIP = await getIP();

    joinRoom(socket, publicIP);

    const createRoom = document.querySelector('#createBtn') as HTMLInputElement;

    createRoom.addEventListener('click', () => {
        const login = document.querySelector('.joinRoom');
        login?.classList.toggle('showRoom')

        disconnect(socket).then( () => {
            document.querySelector('form')?.addEventListener('submit', (e) => {
                e.preventDefault()
                joinRoom(socket)
            })
        })
    })
}

export async function getIP() {
    return fetch('https://hutils.loxal.net/whois') // Alternative https://api.ipify.org/?format=json
            .then((response) => response.json())
                .then((data) => data.ip);
}