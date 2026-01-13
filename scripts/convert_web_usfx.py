import xml.etree.ElementTree as ET
import json
import re
import os

# Configuration
INPUT_FILE = 'public/data/eng-web.usfx.xml'
OUTPUT_FILE = 'public/data/web_nt.json'

# NT Books Order (USFX IDs)
NT_BOOKS = [
    'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL',
    '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
    '3JN', 'JUD', 'REV'
]

# Map to full names if needed, though USFX usually has them in <h> or <toc>
# We will capture names from the XML if possible.

def parse_usfx():
    print(f"Parsing {INPUT_FILE}...")
    try:
        tree = ET.parse(INPUT_FILE)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return

    # Remove namespace if present (ElementTree usually keeps them unless tailored)
    # The sample showed no xmlns prefix on tags, just default xmlns in root.
    # We might need to handle namespace usually like {http://eBible.org/usfx.xsd}book
    # Let's check root tag.
    ns = {'ns': 'http://eBible.org/usfx.xsd'} # Based on <usfx xmlns:xsi="..."> but explicit xmlns is not shown on tags in sample?
    # Sample line 1: <usfx xmlns:xsi="http://eBible.org/usfx.xsd" xsi:noNamespaceSchemaLocation="usfx.xsd">
    # Wait, there is NO default xmlns="..." in the sample line 1. So no namespace for tags.
    
    bible_data = []

    for book_node in root.findall('book'):
        book_id = book_node.get('id')
        if book_id not in NT_BOOKS:
            continue
            
        print(f"Processing {book_id}...")
        
        # Get Book Name from <h>
        h_node = book_node.find('h')
        book_name = h_node.text.strip() if h_node is not None and h_node.text else book_id
        
        chapters = []
        current_chapter = []
        
        # In USFX, <c id="1"/> starts a chapter. verses follow.
        # It's a flat list of elements inside <book> usually, or inside <p>.
        # The sample shows <c> is a sibling of <p>. <v> is inside <p>.
        # This makes parsing tricky with ElementTree since it's mixed content.
        # We need to iterate over all children of <book> in order.
        
        # Helper to process paragraph content
        # But <c> is at book level.
        
        active_chapter_num = 0
        
        # Iterate all children of book to respect order
        for child in book_node:
            if child.tag == 'c':
                # New Chapter
                if active_chapter_num > 0:
                    chapters.append(current_chapter)
                
                active_chapter_num = int(child.get('id'))
                current_chapter = [] # List of verses {num, text, footnotes}
                
            elif child.tag == 'p' or child.tag == 'q':
                # Paragraph or Quote block containing verses
                # We need to parse mixed content: text, <v>, <ve>, <f>, etc.
                # ElementTree mixed content handling is manual: .text and .tail
                
                # We will traverse the paragraph children + text
                
                # Context state
                current_verse_num = None
                current_verse_text = ""
                current_verse_notes = []
                
                def flush_verse():
                    nonlocal current_verse_text, current_verse_notes, current_verse_num
                    if current_verse_num is not None:
                        # Find if we already have this verse in this chapter (verse continuation across paragraphs)
                        existing = next((v for v in current_chapter if v['num'] == current_verse_num), None)
                        
                        clean_text = current_verse_text.strip()
                        if clean_text:
                             if existing:
                                 existing['text'] += " " + clean_text
                                 existing['footnotes'].extend(current_verse_notes)
                             else:
                                 current_chapter.append({
                                     'num': current_verse_num,
                                     'text': clean_text,
                                     'footnotes': current_verse_notes
                                 })
                        elif current_verse_notes and existing:
                            # Just notes added
                            existing['footnotes'].extend(current_verse_notes)

                    # Reset text accumulator, but KEEP verse number because verse continues until <ve> or next <v>
                    current_verse_text = ""
                    current_verse_notes = []

                # Handle text at start of p (before first tag)
                if child.text:
                    # If we are inside a verse (active from previous p?), append.
                    # USFX <ve/> implies verse ends. If no <ve/>, it continues.
                    # We'll assume text belongs to current_verse_num if set.
                    if current_verse_num:
                        current_verse_text += child.text

                for sub in child:
                    if sub.tag == 'v':
                        flush_verse() # End previous chunk
                        current_verse_num = int(sub.get('id'))
                        # handle tail
                        if sub.tail: current_verse_text += sub.tail
                        
                    elif sub.tag == 've':
                        flush_verse()
                        current_verse_num = None # Verse explicitly ended
                        if sub.tail: pass # Text after verse end? usually none or whitespace

                    elif sub.tag == 'f':
                        # Footnote
                        # Extract text from footnote
                        f_text = "".join(sub.itertext()).strip()
                        current_verse_notes.append(f_text)
                        
                        # Add a marker to text? User wants "hover".
                        # We won't add marker to text string, we'll let frontend handle it 
                        # OR we insert a placeholder like `[NOTE]`?
                        # Actually, better to just clean the text and let frontend render distinct icons if it knows there are notes.
                        # But where does the note appear? At the point of insertion?
                        # Yes, standard USFX has <f> at the specific point.
                        # If we just append to a list, we lose position.
                        # **Critial**: User wants "hover footnotes". They likely want the indicator at the correct word.
                        
                        # Solution: Insert a special marker in text, e.g. `###NOTE_INDEX###`
                        current_verse_text += f"__NOTE:{len(current_verse_notes)-1}__" 
                        
                        if sub.tail: current_verse_text += sub.tail
                    
                    else:
                        # valid generic tag (e.g. <wj> words of Jesus)
                        # We want the text content
                        if sub.text: current_verse_text += sub.text
                        if sub.tail: current_verse_text += sub.tail

                flush_verse()

        # End of book
        if current_chapter:
             chapters.append(current_chapter)
             
        bible_data.append({
            'abbrev': book_id,
            'name': book_name,
            'chapters': chapters
        })

    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(bible_data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(bible_data)} books to {OUTPUT_FILE}")

if __name__ == "__main__":
    parse_usfx()
