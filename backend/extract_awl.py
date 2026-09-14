import pypdf
import re
import json

reader = pypdf.PdfReader('/app/awl_570.pdf')

all_words = []

for page_idx in range(1, len(reader.pages)):
    page = reader.pages[page_idx]
    items = []
    
    def visitor(text, cm, tm, fontDict, fontSize):
        if text.strip():
            items.append((tm[4], tm[5], text))
            
    page.extract_text(visitor_text=visitor)
    
    # Filter content between header and footer
    content_items = [it for it in items if 70 < it[1] < 690]
    
    # Headword column: x < 145
    headwords = []
    for it in content_items:
        x, y, text = it
        if x < 145 and re.search(r'[a-zA-Z]', text):
            headwords.append((y, text.strip()))
            
    merged_headwords = []
    for y, text in sorted(headwords, key=lambda x: -x[0]):
        if not merged_headwords or abs(merged_headwords[-1][0] - y) > 5:
            merged_headwords.append([y, text])
        else:
            merged_headwords[-1][1] += text
            
    for idx, (hy, hw) in enumerate(merged_headwords):
        next_y = merged_headwords[idx+1][0] if idx + 1 < len(merged_headwords) else 70.0
        row_items = [it for it in content_items if next_y + 1 < it[1] <= hy + 6]
        
        col_meaning = [it for it in row_items if 140 <= it[0] < 280]
        col_sublist = [it for it in row_items if 280 <= it[0] < 330]
        col_related = [it for it in row_items if it[0] >= 330]
        
        def assemble_text(col_list):
            lines = {}
            for x, y, t in sorted(col_list, key=lambda it: (-it[1], it[0])):
                found_k = None
                for k in lines:
                    if abs(k - y) < 4:
                        found_k = k
                        break
                if found_k is None:
                    lines[y] = [t]
                else:
                    lines[found_k].append(t)
            res = []
            for k in sorted(lines.keys(), reverse=True):
                res.append("".join(lines[k]))
            return " ".join(res).strip()

        meaning_str = assemble_text(col_meaning)
        sublist_str = assemble_text(col_sublist)
        related_str = assemble_text(col_related)
        
        all_words.append({
            "word": hw.strip(),
            "meaning": meaning_str.strip(),
            "sublist": sublist_str.strip(),
            "related": related_str.strip(),
            "page": page_idx + 1
        })

print(f"TOTAL EXTRACTED: {len(all_words)}")
with open('/app/awl_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(all_words, f, ensure_ascii=False, indent=2)

print("Saved to /app/awl_extracted.json!")
