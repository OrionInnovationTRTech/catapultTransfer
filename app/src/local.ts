import { disconnect, joinRoom } from "./socket";

export async function localRoom(socket: any) {
    const publicIP = await getIP();

    // Join local room
    joinRoom(socket, publicIP);

    const createRoom = document.querySelector('#createBtn') as HTMLInputElement;
    const roomName = document.querySelector('#roomName') as HTMLHeadingElement;

    //Set up event listener for custom room
    document.querySelector('form')?.addEventListener('submit', (e) => {
        e.preventDefault()

        // Connect to custom room
        joinRoom(socket)
    })

    roomName.innerHTML = "Local"

    // Wait for custom room to be created
    createRoom.addEventListener('click', () => {
        const login = document.querySelector('.joinRoom');
        login?.classList.toggle('showRoom')

        roomName.innerHTML = ""

        // Disconnect from local room
        disconnect(socket)
    })
}

export async function getIP() {
    return fetch('https://hutils.loxal.net/whois') // Alternative https://api.ipify.org/?format=json
            .then((response) => response.json())
                .then((data) => data.ip);
}