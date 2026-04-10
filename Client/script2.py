import re

file_path = 'd:/lap datas/lap datas/Macrozn-projects/amudhu/Client/src/pages/HomePage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main wrapper
new_content = content.replace(
    'className="relative overflow-hidden bg-white h-[304.0625rem] w-full"',
    'className="w-full min-h-screen bg-white flex flex-col overflow-x-hidden pb-20"'
)

# Hero Section
new_content = new_content.replace(
    'className="absolute left-0 overflow-hidden bg-[linear-gradient(90.0deg,rgba(237,255,245,1.00)_0.0%,rgba(254,255,239,1.00)_100.0%)] shadow-[0rem_5.25rem_3.9375rem_-4.1875rem_rgba(0,0,0,0.10)] h-[36.704375rem] w-full flex flex-col justify-start items-center flex-nowrap gap-10 pt-[5.625rem] pb-0 px-[11.8125rem] rounded-br-[4.5rem] rounded-bl-[4.5rem] top-16"',
    'className="relative w-full overflow-hidden bg-[linear-gradient(90.0deg,rgba(237,255,245,1.00)_0.0%,rgba(254,255,239,1.00)_100.0%)] shadow-[0rem_5.25rem_3.9375rem_-4.1875rem_rgba(0,0,0,0.10)] flex flex-col lg:flex-row justify-center items-center gap-10 pt-20 lg:pt-[5.625rem] pb-10 px-4 md:px-10 lg:px-[11.8125rem] rounded-br-[4.5rem] rounded-bl-[4.5rem] mt-4"'
)

new_content = new_content.replace(
    'className="absolute h-[24.625rem] w-[90rem] left-[-0.25rem] flex flex-col justify-center items-center flex-nowrap gap-[3.25rem] top-[53.891875rem]"',
    'className="relative w-full max-w-7xl mx-auto flex flex-col justify-center items-center gap-[3.25rem] mt-20 px-4"'
)

new_content = new_content.replace(
    'className="absolute w-full top-[78rem] z-20"',
    'className="relative w-full z-20 mt-16 px-4 max-w-7xl mx-auto"'
)

new_content = new_content.replace(
    'className="absolute h-[27.3125rem] w-[90rem] left-[-0.25rem] flex flex-col justify-start items-center flex-nowrap gap-[3.25rem] top-[105rem]"',
    'className="relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4"'
)

new_content = new_content.replace(
    'className="absolute h-[42.625rem] w-[90rem] left-[-0.25rem] flex flex-col justify-start items-center flex-nowrap gap-[3.25rem] top-[137.829375rem]"',
    'className="relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4"'
)

new_content = new_content.replace(
    'className="absolute h-[21.4375rem] w-[90rem] left-[-0.25rem] flex flex-col justify-start items-center flex-nowrap gap-[3.25rem] top-[185.954375rem]"',
    'className="relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4"'
)

new_content = new_content.replace(
    'className="absolute h-[23.625rem] w-[90rem] left-[-0.25rem] flex flex-col justify-start items-center flex-nowrap gap-[3.25rem] top-[212.891875rem]"',
    'className="relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4"'
)

new_content = new_content.replace(
    'className="absolute h-[25.3125rem] w-[82.5rem] left-[-0.25rem] flex flex-col justify-start items-center flex-nowrap gap-2.5 px-[3.75rem] py-0 top-[221.016875rem]"',
    'className="relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-2.5 px-4 mt-20"'
)

# Inner replacements
new_content = new_content.replace('w-[66.375rem]', 'w-full max-w-4xl px-4')
new_content = new_content.replace('w-[52.8125rem]', 'w-full max-w-2xl px-4')
new_content = new_content.replace('w-[90rem]', 'w-full')
new_content = new_content.replace('w-[39.25rem]', 'w-full max-w-lg px-4')
new_content = new_content.replace('h-[18.5rem]', 'h-auto min-h-[14rem]')
new_content = new_content.replace('h-[13.25rem]', 'h-auto')
new_content = new_content.replace('h-[7.5rem]', 'h-auto flex-wrap')
new_content = new_content.replace('text-5xl', 'text-4xl md:text-5xl')
new_content = new_content.replace('text-[2rem]', 'text-2xl md:text-[2rem]')
new_content = new_content.replace('w-[calc(100%-0rem-0rem)]', 'w-full')

# "Explore Flavours" Header frame width
new_content = new_content.replace(
    'className="relative h-[9.3125rem] w-[calc(100%-3.75rem-3.75rem)] flex flex-row justify-start items-center flex-nowrap gap-[16.5625rem] px-[3.75rem] py-0"',
    'className="w-full flex flex-col md:flex-row justify-between items-center gap-6 px-4"'
)

# "How it works" Grid flow
new_content = new_content.replace(
    'className="relative h-[11.4375rem] w-[calc(100%-0rem-0rem)] flex flex-row justify-center items-center flex-wrap gap-x-[3.3125rem] gap-y-[3.3125rem]"',
    'className="w-full h-auto flex flex-wrap justify-center items-center gap-4 md:gap-[3.3125rem]"'
)

# "Request bulk quote" gradient box responsive
new_content = new_content.replace(
    'className="relative bg-[linear-gradient(90.0deg,rgba(237,255,245,1.00)_0.0%,rgba(254,255,239,1.00)_100.0%)] h-[19.6875rem] w-[calc(100%-2.5rem-2.5rem)] flex flex-row justify-center items-end flex-wrap gap-x-[1.875rem] gap-y-[1.875rem] pt-20 pb-0 px-10 rounded-[1.625rem] border-solid border-[0.3125rem]"',
    'className="relative h-auto bg-[linear-gradient(90.0deg,rgba(237,255,245,1.00)_0.0%,rgba(254,255,239,1.00)_100.0%)] w-full flex flex-col md:flex-row justify-center items-center gap-8 pt-10 md:pt-20 pb-0 px-6 md:px-10 rounded-[1.625rem] border-solid border-[0.3125rem]"'
)

# Who we serve inner items responsive flex
new_content = new_content.replace(
    'className="relative h-[8.375rem] w-[calc(100%-0rem-0rem)] flex flex-row justify-center items-center flex-wrap gap-x-[3.25rem] gap-y-[3.25rem]"',
    'className="w-full h-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"'
)
new_content = new_content.replace('h-[14.625rem]', 'h-auto')
new_content = new_content.replace('h-[24.625rem]', 'h-auto')
new_content = new_content.replace('w-[82.5rem]', 'w-full')
new_content = new_content.replace('h-[25.3125rem]', 'h-auto')

# Handle "What Our Clients Say" review cards wrapper
new_content = new_content.replace(
    'className="relative overflow-hidden h-[12.375rem] w-[82.5rem] flex flex-col justify-start items-center flex-nowrap gap-2.5 px-0 py-2.5"',
    'className="relative overflow-hidden w-full h-auto flex flex-col justify-start items-center flex-nowrap gap-2.5 py-4"'
)
new_content = new_content.replace(
    'className="relative h-[12.375rem] w-[calc(100%-0rem-0rem)] flex flex-row justify-start items-center flex-nowrap gap-[3.25rem]"',
    'className="w-full overflow-x-auto pb-4 flex flex-row justify-start items-start gap-4 md:gap-[3.25rem] min-w-max px-4 hide-scrollbar"'
)
new_content = new_content.replace('h-[23.625rem]', 'h-auto')

# Remove hidden sections using simple splitting
if 'className="hidden"' in new_content:
    parts = new_content.split('<div')
    cleaned_parts = []
    skip = False
    skip_depth = 0
    for part in parts:
        if 'className="hidden"' in part and ('id="_22_9029__Footer"' in part or 'id="_22_9071__Header_tabs"' in part):
            skip = True
            skip_depth = 1
            # We also need to count closing divs
            skip_depth -= part.count('</div>')
            continue
        
        if skip:
            skip_depth += 1
            skip_depth -= part.count('</div>')
            if skip_depth <= 0:
                skip = False
                # Re-add whatever followed the final string
                suffix = '</div>'.join(part.split('</div>')[1:])
                if suffix.strip():
                    cleaned_parts.append(suffix)
            continue
        cleaned_parts.append(part)
    
    if len(cleaned_parts) > 1:
        # Instead of doing that messy split thing, let's just use regex with re.sub which handles \n properly.
        new_content = re.sub(r'<div\s+id="[^"]+Footer"\s+className="hidden">.*?(?=<Footer />)', '', new_content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replacements made successfully.")
