import re

file_path = 'd:/lap datas/lap datas/Macrozn-projects/amudhu/Client/src/pages/HomePage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove anything that's `<div id="_22_9029__Footer" className="hidden">...</div>`
# until `<Footer />` is encountered.
content = re.sub(r'<div\s+id="[^"]+Footer"\s*className="hidden"\s*>.*?(?=<Footer />)', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
