if (!appPath) document.body.innerHTML = 'Error: appPath is not defined';

document.querySelectorAll('.button[href]').forEach(button => button.addEventListener('click', function (event) {
    event.preventDefault();
    anim_out();
    setTimeout(() => {
        window.location.href = button.getAttribute('href');
    }, 750)
}));

document.getElementById('back')?.addEventListener('click', back);
document.getElementById('next')?.addEventListener('click', next);
document.getElementById('start')?.addEventListener('click', start);
document.getElementById('create')?.addEventListener('click', create);
document.getElementById('sync')?.addEventListener('click', sync);
document.getElementById('save')?.addEventListener('click', save);
document.querySelector('.fixed5')?.addEventListener('click', clearChanges);

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
    if (document.referrer && (document.referrer !== window.location.href)) {
        document.querySelector('.fixed4').classList.add('visible');
        document.querySelector('.fixed4').addEventListener('click', function () {
            window.history.back();
        });
    };
    const pathStorage = JSON.parse(localStorage.getItem(window.location.href.replace(appPath, '')) || '{}');
    if (pathStorage && (Object.keys(pathStorage).length > 0)) {
        document.querySelectorAll('.inputField').forEach(field => {
            field.querySelectorAll('input:not([type="radio"]), textarea').forEach(input => {
                if (pathStorage[field.id]) {
                    input.value = pathStorage[field.id];
                };
            });
            field.querySelectorAll('.checkbox').forEach(checkbox => {
                if ((pathStorage[field.id] === true) || (pathStorage[field.id] === 'true')) {
                    checkbox.classList.add('checked');
                    const input = field.querySelector('input[type="checkbox"]');
                    input.checked = true;
                };
            });
            field.querySelectorAll('.radioOption').forEach(radio => {
                const input = radio.querySelector('input[type="radio"]');
                if (pathStorage[field.id] === input.value) {
                    field.querySelectorAll('.radioOption input[type="radio"]').forEach(r => r.checked = false);
                    input.checked = true;
                };
            });
            field.querySelectorAll('select').forEach(select => {
                if (pathStorage[field.id]) {
                    select.value = pathStorage[field.id];
                };
            });
        });
        document.querySelector('.fixed3').classList.add('visible');
        setTimeout(() => {
            document.querySelector('.fixed3').classList.remove('visible');
            document.querySelector('.fixed5').classList.add('visible');
        }, 2000);
    };
    if (typeof restore === 'object' && (Object.keys(restore).length > 0)) {
        Object.keys(restore).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                const input = field.querySelector('input, textarea, select');
                if (input) {
                    if (input.type === 'checkbox') {
                        if (restore[key] === true) {
                            field.querySelector('.checkbox').classList.add('checked');
                            input.checked = true;
                        };
                    } else if (input.type === 'radio') {
                        field.querySelectorAll('.radioOption input[type="radio"]').forEach(radio => {
                            if (radio.value === restore[key]) {
                                radio.checked = true;
                            };
                        });
                    } else {
                        input.value = restore[key];
                    };
                };
            };
        });
    };
};

window.addEventListener('pageshow', (event) => {
    if (event.persisted) anim_in();
});

window.addEventListener('pagehide', (event) => {
    if (event.persisted) anim_out();
});

// anim_out();
// setTimeout(() => {
//     anim_in();
// }, 750)

var step = 0;
var backDisabled = false;

function start() {
    if (backDisabled) return;
    next();
    document.getElementById('start').classList.add('hidden');
    document.getElementById('next').classList.remove('hidden');
};

function next() {
    if (backDisabled) return;
    if (step > 0) {
        const currentField = document.querySelector(`.inputField[step="${step}"]`);
        if (currentField && currentField.classList.contains('required')) {
            const input = currentField.querySelector('input, textarea, select');
            if (input) {
                if (input.type === 'checkbox') {
                    if (!input.checked) {
                        input.focus();
                        shake(currentField);
                        return;
                    };
                } else if (input.type === 'radio') {
                    const radios = currentField.querySelectorAll('input[type="radio"]');
                    var checked = false;
                    radios.forEach(radio => {
                        if (radio.checked) checked = true;
                    });
                    if (!checked) {
                        input.focus();
                        shake(currentField);
                        return;
                    };
                } else {
                    if (!input.value.trim()) {
                        input.focus();
                        shake(currentField);
                        return;
                    };
                };
            };
        };
    };
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
    const newField = document.querySelector(`.inputField[step="${step}"]`);
    if (newField) {
        const input = newField.querySelector('input, textarea, select');
        if (input) input.focus();
    };
};

function back() {
    if (backDisabled) return;
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
    const newField = document.querySelector(`.inputField[step="${step}"]`);
    if (newField) {
        const input = newField.querySelector('input, textarea, select');
        if (input) input.focus();
    };
};

function saveChange(path, key, value) {
    var pathChanges = JSON.parse(localStorage.getItem(path) || '{}');
    pathChanges[key] = value;
    localStorage.setItem(path, JSON.stringify(pathChanges));
    console.log(key, value, path, pathChanges);
    document.querySelector('.fixed5').classList.remove('visible');
    document.querySelector('.fixed2').classList.add('visible');
    setTimeout(() => {
        document.querySelector('.fixed2').classList.remove('visible');
    }, 2000);
};

document.querySelectorAll('.inputField').forEach(field => {
    field.querySelectorAll('input:not([type="radio"]), textarea').forEach(input => {
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                next();
            };
            setTimeout(() => saveChange(window.location.href.replace(appPath, ''), field.id, input.value), 100);
        });
    });
    field.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function () {
            checkbox.classList.toggle('checked');
            const input = field.querySelector('input[type="checkbox"]');
            input.checked = !input.checked;
            setTimeout(() => saveChange(window.location.href.replace(appPath, ''), field.id, input.checked), 100);
        });
    });
    field.querySelectorAll('.radioOption').forEach(radio => {
        radio.addEventListener('change', function () {
            field.querySelectorAll('.radioOption input[type="radio"]').forEach(r => r.checked = false);
            const input = radio.querySelector('input[type="radio"]');
            input.checked = true;
            setTimeout(() => saveChange(window.location.href.replace(appPath, ''), field.id, input.value), 100);
        });
    });
    field.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function () {
            setTimeout(() => saveChange(window.location.href.replace(appPath, ''), field.id, select.selectedOptions[0].value), 100);
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

async function create() {
    if (backDisabled) return;
    anim_out();
    var data = {};
    document.querySelectorAll('.inputField').forEach(field => {
        const input = field.querySelector('input, textarea, select');
        if (input) {
            if (input.type === 'checkbox') {
                data[field.id] = input.checked;
            } else if (input.type === 'radio') {
                const radios = field.querySelectorAll('input[type="radio"]');
                radios.forEach(radio => {
                    if (radio.checked) data[field.id] = radio.value;
                });
            } else {
                data[field.id] = input.value;
            };
        };
    });
    await fetch(`${appPath}/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(result => {
            document.getElementById('back').classList.add('hidden')
            document.getElementById('create').classList.add('hidden');
            if (result.status === 'success') {
                document.querySelectorAll('.inputField').forEach(field => {
                    field.classList.remove('active');
                });
                document.getElementById('success').classList.remove('hidden');
                localStorage.removeItem(window.location.href.replace(appPath, ''));
                backDisabled = true;
                document.querySelector('.inner h1').innerText = 'Creation successful';
                document.querySelector('.inner p').innerText = result.message || 'Your commission was created successfully.';
            } else {
                document.querySelectorAll('.inputField').forEach(field => {
                    field.classList.remove('active');
                });
                document.getElementById('error').classList.remove('hidden');
                document.querySelector('.inner h1').innerText = 'Error';
                document.querySelector('.inner p').innerText = result.message || 'An unknown error occurred. Please try again later.';
            };
            setTimeout(() => {
                anim_in();
            }, 750)
        });
};

async function sync() {
    if (backDisabled) return;
    document.getElementById('sync').classList.add('active');
    anim_out();
    await fetch(`${appPath}/sync`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(result => {
            backDisabled = true;
            if (result.status === 'success') {
                window.location.reload();
            } else {
                document.getElementById('error').classList.remove('hidden');
                document.querySelector('.inner h1').innerText = 'Error';
                document.querySelector('.inner p').innerText = result.message || 'An unknown error occurred. Please try again later.';
                setTimeout(() => {
                    anim_in();
                }, 750)
            };
        });
};

async function save() {
    if (backDisabled) return;
    anim_out();
    var data = {};
    document.querySelectorAll('.inputField').forEach(field => {
        const input = field.querySelector('input, textarea, select');
        if (input) {
            if (input.type === 'checkbox') {
                data[field.id] = input.checked;
                console.log(field.id, input.checked)
            } else if (input.type === 'radio') {
                const radios = field.querySelectorAll('input[type="radio"]');
                radios.forEach(radio => {
                    if (radio.checked) data[field.id] = radio.value;
                });
            } else {
                data[field.id] = input.value;
            };
        };
    });
    await fetch(`${appPath}/${commissionId}/edit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(result => {
            backDisabled = true;
            document.getElementById('save').classList.add('hidden');
            if (result.status === 'success') {
                localStorage.removeItem(window.location.href.replace(appPath, ''));
                window.location.href = `${appPath}/${commissionId}`;
            } else {
                document.querySelectorAll('.inputField').forEach(field => {
                    field.classList.remove('active');
                });
                document.getElementById('error').classList.remove('hidden');
                document.querySelector('.inner h1').innerText = 'Error';
                document.querySelector('.inner p').innerText = result.message || 'An unknown error occurred. Please try again later.';
                setTimeout(() => {
                    anim_in();
                }, 750)
            };
        });
};

function progress(percent) {
    const progressBar = document.querySelector('.progress');
    progressBar.style.width = percent + '%';
};

function shake(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
};

function clearChanges() {
    localStorage.removeItem(window.location.href.replace(appPath, ''));
    document.querySelector('.fixed5').classList.remove('visible');
    window.location.reload();
};