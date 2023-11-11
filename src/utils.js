async function handleCommandPrompt(text, args) {
    console.log(text)
    switch (text) {
        case 'New file':
            await manage_new_file();
            toast("New file created.");

            break;
        case 'Close current file':
            await close_file();
            toast("Current file closed.");

            break;

        case 'Command pallet':
            commandPrompt();
            break;
        case 'Switch file':
            let target = $(`.pages > li:nth-child(${args})`)[0];

            if (!args || !target) return;

            switch_tab(target)
            update_active(args);
            break;
        case 'Open file':
            handle_open_file(args);
            toast("File opening initiated.");

            break;
        case 'Switch file (quick)':
            handle_switch_quick();
            break;
        case 'Copy HTML output':
            writeText(document.querySelector('.ck-content').innerHTML);
            toast("HTML output copied to clipboard");

            break;
        case 'Change theme':
            animateDiv(undefined, window.css);
    }
}

function toast(message, duration = 2000) {
    Toastify({
        text: '<img width="20" height="20" src="./assets/exclamation.png"/>' + message,
        duration: duration,
        close: false,
        stopOnFocus: true,
        escapeMarkup: false,
    }).showToast();
}

async function handle_switch_quick() {
    const i = $('.active').text();
    const { next } = await revolver(i - 1);

    let target_ = $(`.pages > li:nth-child(${next + 1})`)[0];

    switch_tab(target_);
    update_active(target_.textContent)
}

async function manage_new_file() {
    let info = await new_file();

    window.title.val(info[0]);
    window.editor.setData(info[1]);
    window.path = info[0];

    let tabs_ = await get_tabs();

    update_active(tabs_.length);
}

async function close_file() {
    const res = await update_opened(window.path, false);
    const last = res.length - 1;

    if (!res[last]) {
        const res = await new_file();

        window.path = res[0];


        if (window.editor.getData() === '' && window.title.val().includes("Untitled")) {
            await delete_file(window.title.val());
        }

        window.title.val(res[0]);
        window.editor.setData(res[1]);

        const tabs = await get_tabs();

        await manage_tabs(tabs);
        await update_active(tabs.length);

        return;
    }

    const path = await find_by_id(res[last]);

    window.path = path;

    const file = await read_file(window.path);

    window.title.val(file[0]);
    window.editor.setData(file[1]);

    const tabs = await get_tabs();

    await manage_tabs(tabs);
    await update_active(tabs.length);

    return;
}

async function get_tabs() {
    const tabs = await retrieve_opened();

    return tabs;
}

function update_words(content) {
    const chars = content.length;
    const words = content.match(/([^ ]+)/g)?.length || 0

    $('#chars').text(chars?.toLocaleString());
    $('#words').text(words?.toLocaleString());
}

async function handle_open_file(path) {
    if (!path) return;

    path = path.split('\\');
    path = path[path.length - 1];

    let info = await open_file(path);

    window.title.val(info[0]);
    window.editor.setData(info[1]);
    window.path = info[0];

    let tabs_ = await get_tabs();

    update_active(tabs_.length);
    manage_tabs(tabs_);
}
async function update_active(i) {
    $('.active').removeClass('active');
    $(`.pages > li:nth-child(${i})`).addClass('active');
}

async function manage_tabs(tabs) {
    const currentActive = $('.active').text();

    $('.pages').html('');

    for (let i = 0; i < tabs.length; i++) {
        var newLi = $("<li>").text(i + 1);

        if (i === currentActive - 1) {
            newLi.addClass("active");
        } else if (!currentActive && i === tabs.length - 1) {
            newLi.addClass("active");
        }

        $(".pages").append(newLi);

        const info = await read_file_by_id(tabs[i]);

        tippy(`.pages > li:nth-child(${i + 1})`, {
            content: info[0],
        });
    }
}

async function retrieve_last_opened() {
    const tabs = await get_tabs();
    const info = await read_file_by_id(tabs[tabs.length - 1] || '0'); // default

    manage_tabs(tabs);

    if (info[0] === '') {
        const res = await new_file();

        return res;
    }

    return info;
}

async function switch_tab(target) {
    const tabs = await get_tabs();

    const info = await read_file_by_id(tabs[target.textContent - 1]);

    window.title.val(info[0]);
    window.editor.setData(info[1]);
    window.path = window.title.val();

    $(".active").removeClass('active');
    $(target).addClass('active');
}

async function revolver(i) {
    const tabs123 = await get_tabs();

    const next = (i - 1) < 0 ? tabs123.length - 1 : i - 1; // math :D

    return { tabs: tabs123, next };
}

async function delete_tab(target) {
    const i = target.textContent - 1;

    const { tabs, next } = await revolver(i)

    const path = await read_file_by_id(tabs[i]);

    await update_opened(path[0], false);
    delete_child(path[0]);

    const info = await read_file_by_id(tabs[next]) // revolve

    if (info[0] === '') return manage_new_file();

    const tabs_ = await get_tabs();

    window.title.val(info[0]);
    window.editor.setData(info[1]);
    window.path = window.title.val();

    await manage_tabs(tabs_);
    await update_active(next);
}

function changeTheme(cssUrl) {
    console.log(cssUrl)
    const linkElement = $('<link>');
    linkElement.attr('rel', 'stylesheet');
    linkElement.attr('href', cssUrl);

    $('link[data-theme]').remove();

    linkElement.attr('data-theme', 'dynamic-theme');

    $('head').append(linkElement);

    set_theme(cssUrl);
    window.themeInput.val(cssUrl);
}