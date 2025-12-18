const chapterSelect = document.getElementById('chapterSelect');
const editionSelect = document.getElementById('editionSelect');
const editionGroup = document.getElementById('edition-selector-group');
const versesContainer = document.getElementById('verses-container');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const mainContent = document.getElementById('main-content');

let currentMode = 'triple'; // 'triple' or 'single'
let currentEdition = 'text_ref'; // for single mode
let currentData = [];

// Initialize
async function init() {
    populateChapterDropdown();

    // Default to Chapter 1
    loadChapter(1);

    chapterSelect.addEventListener('change', (e) => {
        loadChapter(parseInt(e.target.value));
    });

    prevBtn.addEventListener('click', () => {
        const current = parseInt(chapterSelect.value);
        if (current > 1) {
            chapterSelect.value = current - 1;
            loadChapter(current - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        const current = parseInt(chapterSelect.value);
        if (current < 114) {
            chapterSelect.value = current + 1;
            loadChapter(current + 1);
        }
    });

    // View Mode Toggle
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            // Update UI Interface
            if (currentMode === 'single') {
                mainContent.classList.remove('view-triple');
                mainContent.classList.add('view-single');
                editionGroup.style.display = 'flex';
                // Trigger re-render to hide/show columns
                renderChapter(currentData);
            } else {
                mainContent.classList.remove('view-single');
                mainContent.classList.add('view-triple');
                editionGroup.style.display = 'none';
                renderChapter(currentData);
            }
        });
    });

    // Edition Selector (Single Mode)
    editionSelect.addEventListener('change', (e) => {
        currentEdition = e.target.value;
        renderChapter(currentData);
    });
}

function populateChapterDropdown() {
    for (let i = 1; i <= 114; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Chapter ${i}`;
        chapterSelect.appendChild(option);
    }
}

async function loadChapter(chapterNum) {
    versesContainer.innerHTML = '<div style="text-align:center; padding: 50px;">Loading...</div>';
    versesContainer.scrollTop = 0; // Reset scroll

    prevBtn.disabled = chapterNum <= 1;
    nextBtn.disabled = chapterNum >= 114;

    try {
        const response = await fetch(`../../data/merged_chapters/chapter_${chapterNum}.json`);
        if (!response.ok) throw new Error("File not found");

        const data = await response.json();
        currentData = data;
        renderChapter(data);
    } catch (err) {
        versesContainer.innerHTML = `<div style="text-align:center; padding: 50px; color: red;">Error loading Chapter ${chapterNum}: ${err.message}</div>`;
    }
}

function renderChapter(data) {
    versesContainer.innerHTML = '';

    data.forEach(verse => {
        // 1. Subtitle Row (if exists, checking Ref or merged data)
        // Note: The merged JSON has 'subtitle' at the row level now
        if (verse.subtitle) {
            const subRow = document.createElement('div');
            subRow.className = 'subtitle-row';
            subRow.innerHTML = `<div class="subtitle-text">${verse.subtitle}</div>`;
            versesContainer.appendChild(subRow);
        }

        const row = document.createElement('div');
        row.className = 'verse-row';

        // 1981 Text
        row.appendChild(createCell(verse.verse, verse.text_1981, verse.footnote_1981, 'text_1981'));

        // 1989 Text
        row.appendChild(createCell(verse.verse, verse.text_1989, verse.footnote_1989, 'text_1989'));

        // Reference Text
        row.appendChild(createCell(verse.verse, verse.text_ref, verse.footnote_ref, 'text_ref'));

        versesContainer.appendChild(row);
    });
}

function createCell(verseNum, text, footnote, editionKey) {
    const cell = document.createElement('div');
    cell.className = `verse-cell ${editionKey === currentEdition ? 'active-edition' : ''}`;

    // Verse Number
    const numSpan = document.createElement('span');
    numSpan.className = 'verse-num';
    numSpan.textContent = verseNum;
    cell.appendChild(numSpan);

    // Text Processing (Simple Footnote Highlighting)
    // If text has '*', replace with superscript? 
    // Actually, let's keep text clean and append footnote below.
    const textDiv = document.createElement('div');
    textDiv.className = 'verse-text';
    textDiv.textContent = text || "";
    if (!text) textDiv.innerHTML = "<span style='color:#eee'>-</span>";
    cell.appendChild(textDiv);

    // Footnote Section
    if (footnote) {
        const fnSection = document.createElement('div');
        fnSection.className = 'footnote-section';
        // Basic parsing: Split by numbers if possible, or just dump text
        // Usually footnotes start with * or numbers.
        // Let's just text for now.
        fnSection.innerHTML = `<div class="footnote-item"><b>Note:</b> ${footnote}</div>`;
        cell.appendChild(fnSection);
    }

    return cell;
}

init();
