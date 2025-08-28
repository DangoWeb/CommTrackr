document.querySelectorAll('.button[href]').forEach(button => button.addEventListener('click', function(event) {
    event.preventDefault();
    anim_out();
    setTimeout(() => {
        window.location.href = button.getAttribute('href');
    }, 750)
}));

function anim_in() {
    document.querySelector('main').classList.remove('out');
    document.querySelector('main').classList.add('in');
};

function anim_out() {
    document.querySelector('main').classList.remove('in');
    document.querySelector('main').classList.add('out');
};

document.onload = anim_in();

// anim_out();
// setTimeout(() => {
//     anim_in();
// }, 750)