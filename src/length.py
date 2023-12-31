lines = open("App.js", "r").read().split("\n")
for l in range(len(lines)):
    if len(lines[l]) > 80 and l not in [17, 170, 799]:
        print(f"line {l + 1}:", lines[l])
