import re
import sys

file_path = 'd:/lap datas/lap datas/Macrozn-projects/amudhu/Client/src/pages/HomePage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main wrapper
content = re.sub(
    r'className="relative overflow-hidden bg-white h-\[304[^\"]+w-full"',
    'className="w-full min-h-screen bg-white flex flex-col overflow-x-hidden pb-20"',
    content
)

# 2. Section wrappers
# Hero
content = re.sub(
    r'absolute left-0 overflow-hidden bg-\[linear-gradient[^\"]+top-16',
    'relative w-full overflow-hidden bg-[linear-gradient(90.0deg,rgba(237,255,245,1.00)_0.0%,rgba(254,255,239,1.00)_100.0%)] shadow-[0rem_5.25rem_3.9375rem_-4.1875rem_rgba(0,0,0,0.10)] flex flex-col lg:flex-row justify-center items-center gap-10 pt-20 lg:pt-[5.625rem] pb-10 px-4 md:px-10 lg:px-[11.8125rem] rounded-br-[3rem] lg:rounded-br-[4.5rem] rounded-bl-[3rem] lg:rounded-bl-[4.5rem] mt-4',
    content
)

# Remove absolute, left-[...], top-[...], h-[...] across major sections, making them flex-col
patterns_to_fluidize = [
    (r'absolute h-\[24\.625rem\] w-\[90rem\] left-\[-0\.25rem\] flex flex-col justify-center items-center flex-nowrap gap-\[3\.25rem\] top-\[53\.891875rem\]', 'relative w-full max-w-7xl mx-auto flex flex-col justify-center items-center gap-[3.25rem] mt-20 px-4'),
    (r'absolute w-full top-\[78rem\] z-20', 'relative w-full z-20 mt-16 px-4 max-w-7xl mx-auto'),
    (r'absolute h-\[27\.3125rem\] w-\[90rem\] left-\[-0\.25rem\] flex flex-col justify-start items-center flex-nowrap gap-\[3\.25rem\] top-\[105rem\]', 'relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4'),
    (r'absolute h-\[42\.625rem\] w-\[90rem\] left-\[-0\.25rem\] flex flex-col justify-start items-center flex-nowrap gap-\[3\.25rem\] top-\[137\.829375rem\]', 'relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4'),
    (r'absolute h-\[21\.4375rem\] w-\[90rem\] left-\[-0\.25rem\] flex flex-col justify-start items-center flex-nowrap gap-\[3\.25rem\] top-\[185\.954375rem\]', 'relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4'),
    (r'absolute h-\[23\.625rem\] w-\[90rem\] left-\[-0\.25rem\] flex flex-col justify-start items-center flex-nowrap gap-\[3\.25rem\] top-\[212\.891875rem\]', 'relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-[3.25rem] mt-20 px-4'),
    (r'absolute h-\[25\.3125rem\] w-\[82\.5rem\] left-\[-0\.25rem\] flex flex-col justify-start items-center flex-nowrap gap-2\.5 px-\[3\.75rem\] py-0 top-\[221\.016875rem\]', 'relative w-full max-w-7xl mx-auto flex flex-col justify-start items-center gap-2.5 px-4 mt-20')
]

for pat, repl in patterns_to_fluidize:
    content = re.sub(pat, repl, content)

# 3. Inner fixed widths/heights that break responsive layout
content = re.sub(r'w-\[66\.375rem\]', 'w-full max-w-4xl px-4', content)
content = re.sub(r'w-\[52\.8125rem\]', 'w-full max-w-2xl px-4', content)
content = re.sub(r'w-\[90rem\]', 'w-full', content)
content = re.sub(r'w-\[39\.25rem\]', 'w-full max-w-lg px-4', content)
content = re.sub(r'h-\[18\.5rem\]', 'h-auto min-h-[14rem]', content)
content = re.sub(r'h-\[13\.25rem\]', 'h-auto', content)
content = re.sub(r'h-\[7\.5rem\]', 'h-auto flex-wrap', content)
content = re.sub(r'text-5xl', 'text-4xl md:text-5xl', content)
content = re.sub(r'text-\[2rem\]', 'text-2xl md:text-[2rem]', content)
content = re.sub(r'w-\[calc\(100%-0rem-0rem\)\]', 'w-full', content)
content = re.sub(r'px-\[11\.8125rem\]', 'px-6 md:px-12', content)

# "How it works" Grid flow
content = re.sub(r'flex flex-row justify-center items-center flex-wrap gap-x-\[3\.3125rem\] gap-y-\[3\.3125rem\]', 'flex flex-wrap justify-center items-center gap-4 md:gap-[3.3125rem]', content)

# "Explore Flavours" Header frame width
content = re.sub(r'w-\[calc\(100%-3\.75rem-3\.75rem\)\] flex flex-row justify-start items-center flex-nowrap gap-\[16\.5625rem\] px-\[3\.75rem\]', 'w-full flex flex-col md:flex-row justify-between items-center gap-6 px-4', content)

# "What Our Clients Say" review cards wrapper (overflow-x on mobile)
content = re.sub(r'flex flex-col justify-start items-center flex-nowrap gap-2\.5 px-0 py-2\.5', 'w-full overflow-x-auto p-4 hide-scrollbar', content)
content = re.sub(r'flex flex-row justify-start items-center flex-nowrap gap-\[3\.25rem\]', 'flex flex-row justify-start items-start gap-4 md:gap-[3.25rem] min-w-max', content)

# "Request bulk quote" gradient box responsive
content = re.sub(r'h-\[19\.6875rem\] w-\[calc\(100%-2\.5rem-2\.5rem\)\] flex flex-row justify-center items-end flex-wrap gap-x-\[1\.875rem\] gap-y-\[1\.875rem\] pt-20 pb-0 px-10 rounded-\[1\.625rem\]', 'w-full flex flex-col md:flex-row justify-center items-center gap-8 pt-10 md:pt-20 pb-0 px-6 md:px-10 rounded-[1.625rem]', content)

# Who we serve inner items responsive flex
content = re.sub(r'flex flex-row justify-center items-center flex-wrap gap-x-\[3\.25rem\] gap-y-\[3\.25rem\]', 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6', content)

# Remove the massive hidden chunks footprint
# Looking for `<div id=\"_22_9029__Footer\" className=\"hidden\">` up to `<Footer />`
content = re.sub(r'<div\s+id=._22_9029__Footer.\s+className=.hidden.>.+?<div\s+id=._22_9071__Header_tabs', '<div id=\"_22_9071__Header_tabs', content, flags=re.DOTALL)
content = re.sub(r'<div\s+id=._22_9071__Header_tabs.\s+className=.hidden.>.+?</div>\s*</div>\s*<Footer />', '</div>\n\n      <Footer />', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
