mod archive;
mod quran;

use archive::Entry;
use quran::Verse;

#[tauri::command]
fn search_verses(query: &str) -> Result<Vec<Verse>, String> {
    quran::search_verses(query)
}

#[tauri::command]
fn list_directory(path: &str) -> Result<Vec<Entry>, String> {
    archive::list_directory(path)
}

#[tauri::command]
fn read_note(path: &str) -> Result<String, String> {
    archive::read_note(path)
}

#[tauri::command]
fn write_note(path: &str, content: &str) -> Result<(), String> {
    archive::write_note(path, content)
}

#[tauri::command]
fn create_note(dir: &str, name: &str) -> Result<String, String> {
    archive::create_note(dir, name)
}

#[tauri::command]
fn resolve_wiki_link(archive_root: &str, page_name: &str) -> Result<String, String> {
    archive::resolve_wiki_link(archive_root, page_name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            search_verses,
            list_directory,
            read_note,
            write_note,
            create_note,
            resolve_wiki_link
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
