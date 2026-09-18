import pathlib, re
text = pathlib.Path('public/atheeg-test.html').read_text(encoding='utf-8')
start = text.index('<script>') + len('<script>')
end = text.index('</script>', start)
code = text[start:end]
print('length', len(code))
# Find first unclosed bracket/quote issue by simple parser
stack = []
quote = None
escape = False
for i, ch in enumerate(code):
    if quote:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == quote:
            quote = None
        continue
    if ch in ('"', "'", '`'):
        quote = ch
        continue
    if ch in '([{':
        stack.append(ch)
    elif ch in ')]}':
        if not stack:
            print('extra closing', ch, 'at', i)
            break
        open_ch = stack.pop()
        pair = {'(': ')', '[': ']', '{': '}'}
        if pair[open_ch] != ch:
            print('mismatch', open_ch, ch, 'at', i)
            break
else:
    print('balanced, stack left', len(stack))
    if stack:
        print('remaining', stack[-20:])
