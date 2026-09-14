"""
Script nạp toàn bộ 570 Academic Word List (AWL) từ PDF vào cơ sở dữ liệu MySQL
với vai trò System, chia sẻ Community (is_global=True).
"""
import pypdf
import re
import os
import json
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Vocabulary, User
from services.oxford_dataset_service import OxfordDatasetService

def seed_awl_570():
    db: Session = SessionLocal()
    oxford_svc = OxfordDatasetService.get_instance()
    
    # Path to PDF
    pdf_path = "/app/awl_570.pdf"
    if not os.path.exists(pdf_path):
        pdf_path = "awl_570.pdf"
        
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found!")
        db.close()
        return

    print("Opening PDF to parse 570 Academic Word List...")
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")

    all_words = []
    
    # Parse through coordinate visitor
    for page_idx in range(1, len(reader.pages)):
        page = reader.pages[page_idx]
        items = []
        
        def visitor(text, cm, tm, fontDict, fontSize):
            if text.strip():
                items.append((tm[4], tm[5], text))
                
        page.extract_text(visitor_text=visitor)
        content_items = [it for it in items if 70 < it[1] < 690]
        
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
            
            clean_word = hw.strip()
            clean_meaning = meaning_str.strip()
            
            # Clean non-digit sublist or filter artifact fragments
            sub_m = re.search(r'\b([1-9]|10)\b', sublist_str)
            sublist_val = sub_m.group(1) if sub_m else ""
            
            if not clean_word or len(clean_word) < 2 or not clean_meaning:
                continue

            all_words.append({
                "word": clean_word,
                "meaning": clean_meaning,
                "sublist": sublist_val,
                "related": related_str
            })

    print(f"Extracted {len(all_words)} raw entries from PDF.")
    
    # Ensure system user exists
    system_user = db.query(User).filter(User.username == "System").first()
    if not system_user:
        system_user = User(
            discord_id="system_admin",
            username="System",
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=IELTSOasisSystem"
        )
        db.add(system_user)
        db.commit()
        db.refresh(system_user)
    
    system_user_id = system_user.id

    inserted_count = 0
    updated_count = 0

    for item in all_words:
        word_raw = item["word"].strip()
        meaning_raw = item["meaning"].strip()
        sublist = item["sublist"] or "1"
        related_raw = item["related"].strip()
        
        # Word families / synonyms
        synonyms = [s.strip() for s in re.split(r'[,;]\s*', related_raw) if s.strip()]
        
        # Check Oxford details for accurate IPA & example
        oxford_info = oxford_svc.get_word_details(word_raw)
        phonetic = "/.../"
        example = ""
        
        if oxford_info:
            phonetic = oxford_info.get("phonetic") or phonetic
            ox_ex = oxford_info.get("example")
            if ox_ex:
                example = ox_ex
        
        if not example:
            example = f"Understanding the concept of '{word_raw}' is essential for academic IELTS writing and reading."

        topic_label = f"AWL Sublist {sublist}"
        memory_hook = f"570 Academic Word List - {word_raw}: {meaning_raw}"

        # Check existing in Vocabulary
        existing = db.query(Vocabulary).filter(
            Vocabulary.word.ilike(word_raw),
            Vocabulary.is_global == True
        ).first()

        if existing:
            # If exists but lacks proper meaning or phonetic, update it
            if not existing.meaning or existing.meaning == word_raw:
                existing.meaning = meaning_raw
            if existing.phonetic == "/.../" and phonetic != "/.../":
                existing.phonetic = phonetic
            if not existing.synonyms and synonyms:
                existing.synonyms = synonyms
            updated_count += 1
        else:
            new_vocab = Vocabulary(
                user_id=system_user_id,
                word=word_raw,
                meaning=meaning_raw,
                phonetic=phonetic,
                example=example,
                topic=topic_label,
                synonyms=synonyms[:6],
                memory_hook=memory_hook,
                is_global=True,
                popularity=10,
                source="Academic Word List (AWL)",
                creator_username="System"
            )
            db.add(new_vocab)
            inserted_count += 1

    db.commit()
    print(f"DONE SEEDING AWL: Inserted {inserted_count} new words, updated {updated_count} existing words.")
    
    total_global = db.query(Vocabulary).filter(Vocabulary.is_global == True).count()
    print(f"Total global community vocabularies now: {total_global}")
    db.close()

if __name__ == "__main__":
    seed_awl_570()
