# python3 icons.py — draws the PWA icons (a red 1x2 brick on the playroom sky).
from PIL import Image, ImageDraw

def icon(size, path):
    s = size / 512
    im = Image.new("RGB", (size, size), "#D9E1EA")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([136*s, 238*s, 376*s, 360*s], radius=18*s, fill="#B40000")
    for x in (168, 280):
        d.rounded_rectangle([x*s, 200*s, (x+64)*s, 250*s], radius=10*s, fill="#B40000")
    d.rectangle([136*s, 330*s, 376*s, 360*s], fill="#8E0000")
    d.rounded_rectangle([136*s, 330*s, 376*s, 360*s], radius=12*s, fill="#8E0000")
    im.save(path)

for n in (180, 192, 512):
    icon(n, f"docs/icons/icon-{n}.png")
