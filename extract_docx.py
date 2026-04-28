import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as zf:
            xml_content = zf.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        
        # The namespace for Word XML
        namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for p in tree.findall('.//w:p', namespace):
            texts = [t.text for t in p.findall('.//w:t', namespace) if t.text]
            if texts:
                paragraphs.append(''.join(texts))
        
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {e}"

files = [
    "Design_PRD.docx",
    "Taskflow_PRD (1).docx",
    "Tech_Stack_Database_PRD.docx"
]

with open("prd_contents.txt", "w", encoding="utf-8") as f:
    for file in files:
        if os.path.exists(file):
            f.write(f"--- {file} ---\n")
            f.write(extract_text_from_docx(file) + "\n")
            f.write("\n" + "="*50 + "\n\n")
        else:
            f.write(f"File not found: {file}\n")

