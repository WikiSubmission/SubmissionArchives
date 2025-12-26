
current_file_path = "src/lib/studyTitles.ts"
with open(current_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace double backslash + single quote with single backslash + single quote
# content has literal characters.
# We want to turn `rashad\\'s` (which is backslash, backslash, quote) -> `rashad\'s` (backslash, quote)
fixed_content = content.replace("\\\\'", "\\'")

with open(current_file_path, 'w', encoding='utf-8') as f:
    f.write(fixed_content)
