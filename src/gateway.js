const invoke = window.__TAURI__.invoke
const tauri = window.__TAURI__;

function save(path, content) {
    invoke('save_file', { path: path + '.md', content })
}

async function update_opened(path, add) {
    const res = await invoke('update_opened', { path, add })

    return res;
}

async function find_by_id(id) {
    const res = await invoke('find_by_id', { id })

    return res;
}

async function read_file(path) {
    const res = await invoke('read_file', { path })

    return res;
}

async function read_file_by_id(id) {
    const res = await invoke('read_file_by_id', { id })

    return res;
}

function save_title(oldPath, newPath) {
    invoke('save_title', { oldPath: oldPath + '.md', newPath: newPath + '.md' })
}

function delete_child(path) {
    invoke('delete_child', { path: path.replace('.md', '') })
}

async function new_file() {
    const res = await invoke('new_file');

    return res;
}

async function open_file(path) {
    const res = await invoke('open_file', { path });

    return res;
}

async function delete_file(path) {
    const res = await invoke('delete_file', { path: path + '.md' })

    return res;
}

async function retrieve_opened() {
    const res = await invoke('retrieve_opened')

    return res;
}


async function ask_for_file() {
    const result = await tauri.dialog.open({
        title: "Choose a file to open.",
        multiple: false,
        defaultPath: 'C:/Users/User/Documents/GitHub/text-editor/Folder/',
        filters: [
            {
                name: 'Markdown',
                extensions: ['md']
            }
        ]
    });

    if (result) return result.replace('.md', '');

    return;
}