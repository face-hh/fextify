// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use nanoid::nanoid;

use std::{fs};

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use directories::ProjectDirs;
use lazy_static::lazy_static;
use std::sync::Mutex;

#[derive(Serialize, Deserialize)]
struct JsonData {
    children: Vec<Child>,
}

#[derive(Serialize, Deserialize)]

struct Child {
    id: String,
    path: String,
}

lazy_static! {
    static ref PATH: Mutex<String> =
        Mutex::new("C:/Users/User/Documents/GitHub/text-editor/Folder".to_string());
}

#[tauri::command]
fn save_file(path: String, content: String) {
    let path = PathBuf::from(PATH.lock().unwrap().clone()).join(path);

    let _ = fs::write(path, content);
    // lmao
}

fn save_config() {
    if let Some(proj_dirs) = ProjectDirs::from("com", "Fextify", "Data") {
        let dir = proj_dirs.data_dir();
        let exists = &dir.join("config.json").exists();

        if *exists {
            let mut path = PATH.lock().unwrap();
            *path = dir.to_str().unwrap().to_string();
        } else {
            if let Err(error) = fs::create_dir_all(&dir) {
                println!("FATAL: COULD NOT CREATE APPDATA FOLDER, STACK: {}", error);
            } else {
                println!("Created config folder in AppData");

                if let Err(error2) = fs::write(
                    PathBuf::from(&dir).join("config.json"),
                    "{\"children\": [],\"opened\": []}",
                ) {
                    println!(
                        "FATAL: COULD NOT CREATE CONFIG IN APPDATA, STACK: {}",
                        error2
                    );
                }

                let mut path = PATH.lock().unwrap();
                *path = dir.to_str().unwrap().to_string();
            }
        }
    }
}

#[tauri::command]
fn delete_file(path: String) -> u8 {
    delete_child(&path.replace(".md", ""));

    let path = PathBuf::from(PATH.lock().unwrap().clone()).join(path);

    let _ = fs::remove_file(&path);

    println!("Removed file: {:?}", path);

    return 0;
}

#[tauri::command]
fn read_file(path: String) -> (String, String) {
    let path_with_ext = format!("{}.md", &path);
    let path_to_file = PathBuf::from(PATH.lock().unwrap().clone()).join(path_with_ext);

    if let Ok(contents) = fs::read_to_string(path_to_file) {
        return (path, contents);
    } else {
        return ("".to_string(), "".to_string());
    }
}

#[tauri::command]
fn read_file_by_id(id: String) -> (String, String) {
    let path = find_by_id(id);
    let result = read_file(path);

    return result;
}

#[tauri::command]
fn new_file() -> (String, String) {
    let alphabet: [char; 16] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f',
    ];

    let id = nanoid!(15, &alphabet);

    let title = "Untitled ".to_owned() + &id;
    let path = PathBuf::from(PATH.lock().unwrap().clone()).join(format!("{}.md", &title));

    let _ = fs::write(&path, "");

    push_child(id.to_owned(), &title);
    update_opened(title.to_owned(), true);

    return (title, "".to_string());
}

fn push_child(id: String, path: &String) {
    let json_path = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");
    let contents = fs::read_to_string(&json_path).expect("Failed to read configuration.");

    let mut json_contents: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");

    // Create a new child object and push it to the "children" array
    let new_child = json!({
        "id": id,
        "path": path,
    });

    match find_by_id(id) {
        already_exists => {
            let cond = !already_exists.is_empty();
            let cond2 = already_exists != "None";

            if cond && cond2 {
                return;
            };
        }
    }

    json_contents["children"]
        .as_array_mut()
        .expect("children should be an array")
        .push(new_child);

    // Serialize the modified JSON back to a string
    let updated_json =
        serde_json::to_string_pretty(&json_contents).expect("Failed to serialize JSON");

    // Write the updated JSON back to the file
    fs::write(&json_path, updated_json).expect("Failed to write configuration.");
}

#[tauri::command]
fn delete_child(path: &str) {
    let json_path: PathBuf = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");
    let contents = fs::read_to_string(&json_path).expect("Failed to read configuration.");

    let mut json_contents: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");

    let children = json_contents["children"]
        .as_array_mut()
        .expect("children should be an array");

    if let Some(index_to_remove) = children
        .iter()
        .position(|child| child["path"].as_str().unwrap() == path)
    {
        children.remove(index_to_remove);
    } else {
        println!("Child with path {} not found.", path);
        return;
    }

    let updated_json =
        serde_json::to_string_pretty(&json_contents).expect("Failed to serialize JSON");

    let _ = fs::write(&json_path, updated_json);
}

#[tauri::command]
fn find_by_id(id: String) -> String {
    let json_path = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");
    let contents = fs::read_to_string(&json_path).expect("Failed to read configuration.");

    let json_contents: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");

    if let Some(child) = json_contents["children"]
        .as_array()
        .and_then(|children| children.iter().find(|child| child["id"] == id))
    {
        let child_id = child["path"].as_str().unwrap_or("Path not found");

        return child_id.to_owned();
    } else {
        println!("(MINOR) Child with id not found: {}", id);

        return "None".to_owned();
    }
}

#[tauri::command]
fn find_by_path(path: &str) -> String {
    let json_path = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");
    let contents = fs::read_to_string(&json_path).expect("Failed to read configuration.");

    let json_contents: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");

    if let Some(child) = json_contents["children"].as_array().and_then(|children| {
        children
            .iter()
            .find(|child| child["path"] == *path.replace(".md", ""))
    }) {
        let child_id = child["id"].as_str().unwrap_or("ID not found");

        return child_id.to_owned();
    } else {
        println!("Child with path not found: {}", path);

        return "None".to_owned();
    }
}

#[tauri::command]
fn update_opened(path: String, add: bool) -> Value {
    let child_id = find_by_path(&path);

    let json_path = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");
    let contents = fs::read_to_string(&json_path).expect("Failed to read configuration.");

    let mut json_contents: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");

    let mut opened = json_contents["opened"].clone();

    if add {
        let id = &Value::String(child_id.clone());
        let thing = opened.as_array().unwrap().contains(id);

        if thing {
            return Value::Null;
        } else {
            opened
                .as_array_mut()
                .expect("children should be an array")
                .push(child_id.into());
        }
    } else {
        if let Some(array) = opened.as_array_mut() {
            array.retain(|x| x.as_str() != Some(&child_id));
        }
    }

    json_contents["opened"] = opened.clone();

    // Serialize the modified JSON back to a string
    let updated_json =
        serde_json::to_string_pretty(&json_contents).expect("Failed to serialize JSON");

    // Write the updated JSON back to the file
    fs::write(&json_path, updated_json).expect("Failed to write configuration.");

    return opened;
}

#[tauri::command]
fn open_file(path: String) -> (String, String) {
    let id = find_by_path(&path);

    push_child(id.to_owned(), &path);
    update_opened(path.to_owned(), true);

    let contents = read_file(path);

    return contents;
}
#[tauri::command]
fn save_title(old_path: String, new_path: String) {
    let old_path_buf = PathBuf::from(PATH.lock().unwrap().clone()).join(&old_path);
    let new_path_buf = PathBuf::from(PATH.lock().unwrap().clone()).join(&new_path);

    let path = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");
    let contents =
        String::from_utf8_lossy(&fs::read(&path).expect("Failed to read configuration."))
            .to_string();

    let mut json_contents: Value = serde_json::from_str(&contents)
        .expect("Couldn't turn config to JSON in update_last_opened.");
    let children = json_contents["children"].as_array_mut().unwrap();

    match fs::rename(old_path_buf, &new_path_buf) {
        Ok(_) => {
            println!("Renamed \"{}\" to \"{}\"", &old_path, &new_path);

            if let Some(index) = children
                .iter()
                .position(|child| child["path"].as_str().unwrap() == old_path.replace(".md", ""))
            {
                let id = &children[index]["id"].as_str().unwrap();
                let path_str = new_path.to_string().replace(".md", "");

                let new_object = json!({
                    "path": path_str,
                    "id": id
                });

                children.remove(index);
                children.insert(0, new_object);

                json_contents["children"] = Value::Array(children.to_owned());

                let back_to_str = serde_json::to_string_pretty(&json_contents).unwrap();

                let _ = fs::write(path, back_to_str);
            } else {
                println!("Couldn't find child with path: {}", &old_path)
            }
        }
        Err(_) => match fs::write(new_path_buf, "") {
            Ok(_) => {
                println!("Rename failed, attempted creation successful.");
            }
            Err(e) => {
                eprintln!("Rename failed, attempted creation fail: {:?}", e);
            }
        },
    };
}

#[tauri::command]
fn retrieve_opened() -> Value {
    let path = PathBuf::from(PATH.lock().unwrap().clone()).join("config.json");

    let contents =
        String::from_utf8_lossy(&fs::read(&path).expect("Failed to read configuration."))
            .to_string();

    let json_contents: Value = serde_json::from_str(&contents)
        .expect("Couldn't turn config to JSON in update_last_opened.");

    let opened_arr = &json_contents["opened"];

    return opened_arr.to_owned();
}

fn main() {
    // retrieve_last_opened(&config_hashmap, config_raw);

    save_config();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_title,
            save_file,
            read_file,
            new_file,
            delete_file,
            find_by_path,
            find_by_id,
            update_opened,
            retrieve_opened,
            read_file_by_id,
            open_file,
            delete_child
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
