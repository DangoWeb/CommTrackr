document.querySelectorAll('.button[href]').forEach(button => button.addEventListener('click', function (event) {
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

window.onload = function () {
    anim_in();
    document.querySelectorAll('.inputField').forEach(field => {
        field.querySelectorAll('input, textarea').forEach(input => {
            if (localStorage.getItem(field.id)) {
                input.value = localStorage.getItem(field.id);
                document.querySelector('.fixed2').classList.add('visible');
                setTimeout(() => {
                    document.querySelector('.fixed2').classList.remove('visible');
                }, 2000);
            };
        });
        field.querySelectorAll('.checkbox').forEach(checkbox => {
            if (localStorage.getItem(field.id) === 'true') {
                checkbox.classList.add('checked');
                const input = field.querySelector('input[type="checkbox"]');
                input.checked = true;
                document.querySelector('.fixed2').classList.add('visible');
                setTimeout(() => {
                    document.querySelector('.fixed2').classList.remove('visible');
                }, 2000);
            };
        });
    });
};

// anim_out();
// setTimeout(() => {
//     anim_in();
// }, 750)

var step = 0;

function start() {
    next();
    document.getElementById('start').classList.add('hidden');
    document.getElementById('next').classList.remove('hidden');
};

function next() {
    if (step < document.querySelectorAll('.inputField').length) {
        document.querySelector(`.inputField[step="${step}"]`)?.classList.remove('active');
        step++;
        document.querySelector(`.inputField[step="${step}"]`)?.classList.add('active');
        progress((step / document.querySelectorAll('.inputField').length) * 100);
    } else {
        document.getElementById('next')?.classList.add('hidden');
        document.getElementById('create')?.classList.remove('hidden');
    };
    if (step >= document.querySelectorAll('.inputField').length) {
        document.getElementById('next')?.classList.add('hidden');
        document.getElementById('create')?.classList.remove('hidden');
    };
    if (step === 1) {
        document.getElementById('back')?.classList.add('hidden');
    } else {
        document.getElementById('back')?.classList.remove('hidden');
    };
};

function back() {
    if (step > 1) {
        document.querySelector(`.inputField[step="${step}"]`)?.classList.remove('active');
        step--;
        document.querySelector(`.inputField[step="${step}"]`)?.classList.add('active');
        progress((step / document.querySelectorAll('.inputField').length) * 100);
    } else {
        document.getElementById('back')?.classList.add('hidden');
    };
    if (step < document.querySelectorAll('.inputField').length) document.getElementById('next')?.classList.remove('hidden');
    if (step === 1) {
        document.getElementById('back')?.classList.add('hidden');
    } else {
        document.getElementById('back')?.classList.remove('hidden');
    };
    document.getElementById('create')?.classList.add('hidden');
};

function saveChange(key, value) {
    localStorage.setItem(key, value);
    document.querySelector('.fixed2').classList.add('visible');
    setTimeout(() => {
        document.querySelector('.fixed2').classList.remove('visible');
    }, 2000);
};

document.querySelectorAll('.inputField').forEach(field => {
    field.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                next();
            };
            saveChange(field.id, input.value);
        });
    });
    field.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function () {
            checkbox.classList.toggle('checked');
            const input = field.querySelector('input[type="checkbox"]');
            input.checked = !input.checked;
            saveChange(field.id, input.checked);
        });
    });
    field.querySelectorAll('.radioOption').forEach(radio => {
        radio.addEventListener('click', function () {
            field.querySelectorAll('.radioOption input[type="radio"]').forEach(r => r.checked = false);
            const input = radio.querySelector('input[type="radio"]');
            input.checked = true;
            saveChange(field.id, input.value);
        });
    });
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (step === 0) {
            start();
        } else {
            next();
        };
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        back();
    };
});

function create() {
    localStorage.clear();
};

function progress(percent) {
    const progressBar = document.querySelector('.progress');
    progressBar.style.width = percent + '%';
};