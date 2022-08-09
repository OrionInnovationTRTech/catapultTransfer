export function circle(element: HTMLElement) {
    element.innerHTML = ''

    var media = window.matchMedia("(max-width: 768px)");
    var inc = 30;
    var max = 120

    if (media.matches) {
        inc = 50;
        max = 400;
    }

    for (let i = inc; i <= max; i += inc) {
        let circle = document.createElement('div');
        circle.classList.add('circle');
        circle.setAttribute(
            'style',
            `width: ${i}%;
            padding-bottom: ${i}%;`
        );

        element.appendChild(circle);
    }
}

export function node(element: HTMLElement) {
    let node = document.createElement('span');
    node.classList.add('node');

    element.appendChild(node);
}