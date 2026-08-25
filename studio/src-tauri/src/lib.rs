mod archive;
mod citations;
mod health;
mod history;
mod import;
mod notes;
mod quran;
mod qurancode;

use archive::{Entry, TrashEntry};
use citations::Citation;
use health::HealthReport;
use history::HistoryEntry;
use notes::NoteRecord;
use quran::Verse;
use qurancode::{
    Aggregate, AggregateQuery, ChapterView, Claim, Counts, Ledger, LetterStat, Metadata,
    Modifiers,
    NumberTarget, RootInfo, Scope,
    SearchOptions, SearchResult, SelectionValue, SimilarityMethod, ToggleInput, ValueResult,
    VerseView, WordInfo,
};

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

#[tauri::command]
fn scan_archive(root: &str) -> Result<Vec<NoteRecord>, String> {
    notes::scan_archive(root)
}

#[tauri::command]
fn read_theme_css(archive_root: &str) -> Option<String> {
    archive::read_theme_css(archive_root)
}

#[tauri::command]
fn duplicate_note(path: &str) -> Result<String, String> {
    archive::duplicate_note(path)
}

#[tauri::command]
fn move_note(path: &str, target_dir: &str) -> Result<String, String> {
    archive::move_note(path, target_dir)
}

#[tauri::command]
fn trash_note(archive_root: &str, path: &str) -> Result<(), String> {
    archive::trash_note(archive_root, path)
}

#[tauri::command]
fn list_trash(archive_root: &str) -> Result<Vec<TrashEntry>, String> {
    archive::list_trash(archive_root)
}

#[tauri::command]
fn restore_note(archive_root: &str, entry_id: &str) -> Result<String, String> {
    archive::restore_note(archive_root, entry_id)
}

#[tauri::command]
fn permanently_delete_trash_entry(archive_root: &str, entry_id: &str) -> Result<(), String> {
    archive::permanently_delete_trash_entry(archive_root, entry_id)
}

#[tauri::command]
fn snapshot_note(archive_root: &str, note_path: &str, content: &str) -> Result<(), String> {
    history::snapshot_note(archive_root, note_path, content)
}

#[tauri::command]
fn list_note_history(archive_root: &str, note_path: &str) -> Result<Vec<HistoryEntry>, String> {
    history::list_note_history(archive_root, note_path)
}

#[tauri::command]
fn restore_note_version(snapshot_path: &str, note_path: &str) -> Result<(), String> {
    history::restore_note_version(snapshot_path, note_path)
}

#[tauri::command]
fn import_files(archive_root: &str, source_paths: Vec<String>) -> Result<Vec<String>, String> {
    import::import_files(archive_root, source_paths)
}

#[tauri::command]
fn import_zip(archive_root: &str, zip_path: &str) -> Result<Vec<String>, String> {
    import::import_zip(archive_root, zip_path)
}

#[tauri::command]
fn attach_pdf_to_note(archive_root: &str, pdf_source_path: &str) -> Result<String, String> {
    archive::attach_pdf_to_note(archive_root, pdf_source_path)
}

#[tauri::command]
fn read_folder_icons(archive_root: &str) -> std::collections::HashMap<String, String> {
    archive::read_folder_icons(archive_root)
}

#[tauri::command]
fn set_folder_icon(archive_root: &str, folder_path: &str, icon: Option<String>) -> Result<(), String> {
    archive::set_folder_icon(archive_root, folder_path, icon)
}

#[tauri::command]
fn read_settings(archive_root: &str) -> Option<String> {
    archive::read_settings(archive_root)
}

#[tauri::command]
fn write_settings(archive_root: &str, json: &str) -> Result<(), String> {
    archive::write_settings(archive_root, json)
}

#[tauri::command]
fn read_citations(archive_root: &str) -> Result<Vec<Citation>, String> {
    citations::read_citations(archive_root)
}

#[tauri::command]
fn write_citation(archive_root: &str, citation: Citation) -> Result<(), String> {
    citations::write_citation(archive_root, citation)
}

#[tauri::command]
fn check_vault_health(archive_root: &str) -> Result<HealthReport, String> {
    health::check_vault_health(archive_root)
}

#[tauri::command]
fn export_sanote(archive_root: &str, note_path: &str, destination_path: &str) -> Result<(), String> {
    import::export_sanote(archive_root, note_path, destination_path)
}

#[tauri::command]
fn import_sanote(archive_root: &str, sanote_path: &str) -> Result<String, String> {
    import::import_sanote(archive_root, sanote_path)
}

#[tauri::command]
fn qc_metadata() -> Result<Metadata, String> {
    qurancode::metadata()
}

#[tauri::command]
fn qc_get_verse(
    chapter: u32,
    verse: u32,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<VerseView, String> {
    qurancode::get_verse(chapter, verse, mode, toggles)
}

#[tauri::command]
fn qc_count(
    scope: Option<Scope>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
) -> Result<Vec<Counts>, String> {
    qurancode::count(scope, toggles, value_system)
}

#[tauri::command]
fn qc_compute_value(
    scope: Option<Scope>,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: String,
    modifiers: Option<Modifiers>,
) -> Result<ValueResult, String> {
    qurancode::compute_value(scope, mode, toggles, value_system, modifiers)
}

#[tauri::command]
fn qc_letter_frequency(
    scope: Option<Scope>,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<Vec<LetterStat>, String> {
    qurancode::letter_frequency(scope, mode, toggles)
}

#[tauri::command]
fn qc_find_text(query: String, options: Option<SearchOptions>) -> Result<SearchResult, String> {
    qurancode::find_text(query, options)
}

#[tauri::command]
fn qc_similarity(
    chapter: u32,
    verse: u32,
    method: Option<SimilarityMethod>,
    threshold: Option<f32>,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
    limit: Option<usize>,
) -> Result<SearchResult, String> {
    qurancode::find_similar(chapter, verse, method, threshold, mode, toggles, limit)
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
fn qc_find_by_number(
    target: i64,
    quantity: Option<NumberTarget>,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
    scope: Option<Scope>,
    limit: Option<usize>,
) -> Result<SearchResult, String> {
    qurancode::find_by_number(target, quantity, mode, toggles, value_system, scope, limit)
}

#[tauri::command]
fn qc_word_info(
    chapter: u32,
    verse: u32,
    position: u32,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<WordInfo, String> {
    qurancode::word_info(chapter, verse, position, mode, toggles)
}

#[tauri::command]
fn qc_get_chapter(
    chapter: u32,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<ChapterView, String> {
    qurancode::get_chapter(chapter, mode, toggles)
}

#[tauri::command]
fn qc_value_of_text(
    text: String,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
) -> Result<SelectionValue, String> {
    qurancode::value_of_text(text, mode, toggles, value_system)
}

#[tauri::command]
fn qc_aggregate(
    query: Option<AggregateQuery>,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
    divisor: Option<i64>,
) -> Result<Aggregate, String> {
    qurancode::aggregate(query, mode, toggles, value_system, divisor)
}

#[tauri::command]
fn qc_ledger() -> Result<Ledger, String> {
    qurancode::ledger()
}

#[tauri::command]
fn qc_claims() -> Result<Vec<Claim>, String> {
    qurancode::claims()
}

#[tauri::command]
fn qc_roots() -> Vec<RootInfo> {
    qurancode::root_list()
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
            resolve_wiki_link,
            scan_archive,
            read_theme_css,
            duplicate_note,
            move_note,
            trash_note,
            list_trash,
            restore_note,
            permanently_delete_trash_entry,
            snapshot_note,
            list_note_history,
            restore_note_version,
            import_files,
            import_zip,
            export_sanote,
            import_sanote,
            attach_pdf_to_note,
            read_folder_icons,
            set_folder_icon,
            read_settings,
            write_settings,
            read_citations,
            write_citation,
            check_vault_health,
            qc_metadata,
            qc_get_verse,
            qc_count,
            qc_letter_frequency,
            qc_compute_value,
            qc_find_text,
            qc_similarity,
            qc_find_by_number,
            qc_word_info,
            qc_roots,
            qc_get_chapter,
            qc_value_of_text,
            qc_aggregate,
            qc_ledger,
            qc_claims
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
