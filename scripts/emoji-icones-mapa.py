# Tabela emoji -> ícone do Bootstrap Icons (https://icons.getbootstrap.com), usada nas aulas e na área do aluno.
# Gera src/lib/emoji-icones.ts. Rodar: python scripts/emoji-icones-mapa.py  (Wagner, 20/11/2026)
import json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAPA = {
    "✅": "check-circle-fill", "✓": "check-lg", "✔": "check-lg", "❌": "x-circle-fill", "✖": "x-lg", "✕": "x-lg",
    "📝": "pencil-square", "🎯": "bullseye", "🤝": "people-fill", "🔁": "arrow-repeat", "🔄": "arrow-clockwise",
    "👀": "eye-fill", "⚖": "bank2", "➡": "arrow-right-circle-fill", "📋": "clipboard-check-fill", "🗣": "megaphone-fill",
    "📅": "calendar-event-fill", "🔍": "search", "🔎": "zoom-in", "🛡": "shield-fill-check", "⚡": "lightning-charge-fill",
    "📈": "graph-up-arrow", "🏃": "person-walking", "✋": "hand-index-fill", "💬": "chat-dots-fill", "📦": "box-seam-fill",
    "📊": "bar-chart-fill", "📄": "file-earmark-text-fill", "✍": "pen-fill", "↔": "arrow-left-right", "🏐": "dribbble",
    "⛔": "slash-circle-fill", "⚠": "exclamation-triangle-fill", "👥": "people-fill", "🔒": "lock-fill", "📏": "rulers",
    "🔢": "123", "👋": "hand-thumbs-up-fill", "🔧": "wrench-adjustable", "🚪": "door-open-fill", "🧱": "bricks",
    "🧍": "person-standing", "🙏": "heart-fill", "👂": "ear-fill", "🏀": "dribbble", "⚽": "dribbble", "📞": "telephone-fill",
    "❓": "question-circle-fill", "❔": "question-circle", "⬆": "arrow-up-circle-fill", "🗂": "folder2-open", "🦺": "cone-striped",
    "📐": "rulers", "🔗": "link-45deg", "🚧": "cone-striped", "🚫": "ban", "🙋": "person-raised-hand", "🧾": "receipt",
    "🏷": "tag-fill", "➕": "plus-circle-fill", "➖": "dash-circle-fill", "📍": "geo-alt-fill", "🧭": "compass-fill",
    "🔤": "fonts", "🛠": "tools", "✌": "hand-index-thumb-fill", "🤲": "hand-index-thumb-fill", "💪": "lightning-fill",
    "🏢": "building-fill", "🧰": "tools", "🧤": "shield-fill-plus", "👣": "person-walking", "🦵": "person-walking",
    "🔥": "fire", "🚶": "person-walking", "📣": "megaphone-fill", "📢": "megaphone-fill", "🎈": "balloon-fill",
    "👍": "hand-thumbs-up-fill", "👎": "hand-thumbs-down-fill", "🪞": "person-bounding-box", "🔌": "plug-fill",
    "↩": "arrow-return-left", "↪": "arrow-return-right", "🚰": "droplet-fill", "🗑": "trash3-fill", "📌": "pin-angle-fill",
    "🛑": "sign-stop-fill", "🛏": "house-heart-fill", "🛌": "moon-stars-fill", "🔔": "bell-fill", "📤": "box-arrow-up",
    "📥": "box-arrow-in-down", "💧": "droplet-fill", "💦": "droplet-half", "🧩": "puzzle-fill", "📁": "folder-fill",
    "📂": "folder2-open", "🪜": "ladder", "🧮": "calculator-fill", "🏆": "trophy-fill", "🥇": "award-fill", "🏅": "award-fill",
    "🗓": "calendar3", "📆": "calendar-week-fill", "📡": "broadcast", "🏛": "bank", "💡": "lightbulb-fill", "⚙": "gear-fill",
    "📘": "book-fill", "📚": "book-half", "📖": "book", "📕": "journal-bookmark-fill", "📒": "journal-text", "📓": "journal",
    "🪢": "bezier2", "🧽": "stars", "💰": "cash-coin", "💵": "cash-stack", "💸": "cash", "💲": "currency-dollar",
    "💳": "credit-card-fill", "🙌": "emoji-smile-fill", "📱": "phone-fill", "📲": "phone-vibrate-fill", "📳": "phone-vibrate",
    "🪪": "person-vcard-fill", "✂": "scissors", "📜": "file-earmark-ruled-fill", "🧑": "person-fill", "👤": "person-fill", "👩": "person-fill",
    "👨": "person-fill", "🦶": "person-walking", "🎓": "mortarboard-fill", "🩺": "heart-pulse-fill", "🚨": "exclamation-octagon-fill",
    "✨": "stars", "🌟": "star-fill", "⭐": "star-fill", "📎": "paperclip", "🧹": "stars", "🗺": "map-fill", "✉": "envelope-fill",
    "📧": "envelope-at-fill", "📩": "envelope-arrow-down-fill", "📨": "envelope-paper-fill", "📮": "mailbox", "📬": "mailbox-flag",
    "🔵": "circle-fill", "🔴": "circle-fill", "🟢": "circle-fill", "🟡": "circle-fill", "🟠": "circle-fill", "⚪": "circle", "⚫": "circle-fill",
    "🟤": "circle-fill", "🕐": "clock-fill", "🕑": "clock-fill", "🕒": "clock-fill", "🕓": "clock-fill", "🕘": "clock-fill", "🕙": "clock-fill",
    "🕛": "clock-fill", "🕤": "clock-fill", "🔀": "shuffle", "🛒": "cart-fill", "🛍": "bag-fill", "🧴": "droplet-half", "💼": "briefcase-fill",
    "💥": "lightning-charge-fill", "🎚": "sliders", "🎛": "sliders2", "🥅": "bullseye", "🧺": "basket-fill", "🧠": "lightbulb-fill",
    "🔑": "key-fill", "🗝": "key", "🗄": "archive-fill", "🎨": "palette-fill", "🖌": "brush-fill", "🖍": "pencil-fill", "✏": "pencil-fill",
    "🖊": "pen-fill", "🧣": "person-standing-dress", "🏦": "bank2", "💻": "laptop-fill", "🖥": "display-fill", "🖱": "mouse-fill",
    "🖨": "printer-fill", "♿": "universal-access-circle", "🧊": "snow", "❄": "snow2", "🌳": "tree-fill", "🌱": "flower2",
    "🌸": "flower1", "🌷": "flower3", "🌻": "sun-fill", "🧪": "eyedropper", "🔬": "search", "🌡": "thermometer-half",
    "🥵": "thermometer-sun", "🥶": "thermometer-snow", "🌊": "water", "🚑": "hospital-fill", "🏥": "hospital", "🔊": "volume-up-fill",
    "🔽": "caret-down-fill", "🔺": "caret-up-fill", "📉": "graph-down-arrow", "👉": "hand-index-fill", "👈": "hand-index-fill",
    "👇": "hand-index-fill", "☝": "hand-index-fill", "🎬": "film", "🎥": "camera-reels-fill", "📹": "camera-video-fill",
    "📷": "camera-fill", "📸": "camera-fill", "🌀": "tornado", "🌉": "signpost-split-fill", "🚦": "stoplights-fill",
    "🙈": "eye-slash-fill", "🪑": "inboxes-fill", "📟": "phone", "🏠": "house-fill", "🏫": "building", "🏨": "building-fill",
    "🏬": "shop", "🏭": "buildings-fill", "🏗": "buildings", "🕳": "record-circle", "🔲": "square", "🔳": "square-fill",
    "⚔": "shield-shaded", "👧": "person-arms-up", "🧒": "person-arms-up", "👶": "person-hearts", "📶": "reception-4",
    "🎧": "headphones", "🎙": "mic-fill", "🎤": "mic-fill", "🎭": "mask", "🌬": "wind", "💨": "wind", "🍽": "cup-hot-fill",
    "☕": "cup-hot-fill", "🛢": "database-fill", "☁": "cloud-fill", "🌧": "cloud-rain-fill", "⛈": "cloud-lightning-rain-fill",
    "🌩": "cloud-lightning-fill", "🌦": "cloud-sun-fill", "🌤": "cloud-sun-fill", "🌫": "cloud-fog2-fill", "☀": "sun-fill",
    "🌞": "sun-fill", "🔆": "brightness-high-fill", "🌅": "sunrise-fill", "🌙": "moon-fill", "🌓": "moon-stars-fill",
    "🌗": "moon-stars-fill", "🚿": "droplet-fill", "🩹": "bandaid-fill", "💊": "capsule", "🤔": "patch-question-fill",
    "💭": "chat-quote-fill", "🧳": "suitcase-lg-fill", "🔓": "unlock-fill", "🔐": "shield-lock-fill", "😴": "moon-stars-fill",
    "💤": "moon-stars-fill", "😊": "emoji-smile-fill", "🙂": "emoji-smile", "😄": "emoji-laughing-fill", "😌": "emoji-smile",
    "😮": "emoji-surprise-fill", "😯": "emoji-surprise", "😞": "emoji-frown-fill", "😔": "emoji-frown", "😠": "emoji-angry-fill",
    "😤": "emoji-angry", "🤨": "emoji-expressionless-fill", "😷": "mask", "🤒": "thermometer-high", "🤧": "virus",
    "🏁": "flag-fill", "🚩": "flag-fill", "🖐": "hand-index-fill", "🤚": "hand-index-fill", "✊": "hand-index-thumb-fill",
    "🤏": "hand-index-thumb", "🥽": "eyeglasses", "↗": "arrow-up-right-circle-fill", "↘": "arrow-down-right-circle-fill",
    "↖": "arrow-up-left-circle-fill", "↕": "arrow-down-up", "💛": "heart-fill", "❤": "heart-fill", "💙": "heart-fill",
    "💓": "heart-pulse-fill", "🫀": "heart-pulse-fill", "🫁": "lungs-fill", "🌍": "globe-americas", "🌎": "globe-americas",
    "🌏": "globe-asia-australia", "🌐": "globe2", "🧯": "fire", "🥾": "person-walking", "👟": "person-walking", "🕸": "diagram-3-fill",
    "👁": "eye-fill", "👏": "hand-thumbs-up-fill", "🐢": "hourglass-split", "🔩": "nut-fill", "🟫": "square-fill",
    "🟩": "square-fill", "🟨": "square-fill", "🟧": "square-fill", "🟥": "square-fill", "🎳": "bullseye", "🤫": "volume-mute-fill",
    "🚚": "truck", "📑": "files", "🎉": "stars", "🎊": "stars", "🕊": "feather", "⛑": "shield-fill-plus", "🚗": "car-front-fill",
    "🚕": "taxi-front-fill", "🚌": "bus-front-fill", "🚓": "car-front-fill", "🚒": "truck-front-fill", "🚲": "bicycle",
    "🚂": "train-front-fill", "🛣": "sign-turn-right-fill", "🧘": "person-arms-up", "♾": "infinity", "🐍": "bezier", "🎗": "patch-check-fill",
    "📰": "newspaper", "🪛": "screwdriver", "🔨": "hammer", "🪚": "tools", "💾": "floppy-fill", "💿": "disc-fill", "💽": "device-hdd-fill",
    "🤸": "person-arms-up", "🗿": "person-standing", "🪂": "wind", "🎶": "music-note-beamed", "🎵": "music-note", "🌈": "rainbow",
    "🚽": "droplet", "🏖": "umbrella-fill", "👑": "award-fill", "🔦": "lightbulb", "🚀": "rocket-takeoff-fill", "👷": "person-gear",
    "⛰": "triangle-fill", "🚜": "truck", "🎽": "person-standing", "🤐": "chat-square-dots", "🥧": "pie-chart-fill", "🫂": "people-fill",
    "⛓": "link", "🛋": "lamp-fill", "🍳": "egg-fried", "🥁": "music-note-beamed", "☎": "telephone-fill", "🙅": "x-octagon-fill",
    "➰": "infinity", "🧸": "balloon-heart-fill", "🎫": "ticket-perforated-fill", "🎟": "ticket-fill", "🚻": "gender-ambiguous",
    "🪣": "bucket-fill", "📵": "phone-flip", "🦘": "arrow-up-right", "🎁": "gift-fill", "🧷": "paperclip", "🪠": "tools",
    "🏚": "house-dash-fill", "🪟": "window", "🧵": "bezier", "🧶": "bezier2", "🙆": "person-check-fill", "🔘": "record-circle-fill",
    "🐸": "arrow-up-right", "🕑": "clock-fill", "🔷": "diamond-fill", "💎": "gem", "🤹": "dribbble", "🥢": "pencil", "🪵": "tree",
    "🙇": "person-down", "🗒": "sticky-fill", "🛝": "person-arms-up", "🔫": "bullseye", "🧬": "radioactive", "🔟": "123",
    "🔚": "skip-end-fill", "🔙": "arrow-left-circle-fill", "🔝": "arrow-up-circle-fill", "🔖": "bookmark-fill", "🔋": "battery-full",
    "💯": "patch-check-fill", "➗": "slash-lg", "🟰": "list", "🦁": "emoji-sunglasses", "🦩": "feather", "☣": "radioactive",
    "☠": "radioactive", "🐝": "bug-fill", "🐛": "bug", "🧲": "magnet-fill", "🏝": "umbrella", "🎒": "backpack-fill",
    "🔃": "arrow-repeat", "⚓": "life-preserver", "📇": "person-vcard", "🔮": "magic", "🤖": "robot", "🫡": "person-check",
    "🐒": "emoji-laughing", "🎲": "dice-5-fill", "🍂": "tree", "🎣": "water", "🏓": "dribbble", "🎪": "balloon-fill",
    "🎾": "dribbble", "❗": "exclamation-circle-fill", "🐘": "emoji-smile", "🚭": "ban", "🧏": "ear", "☄": "stars",
    "🏹": "bullseye", "🛎": "bell-fill", "🛟": "life-preserver", "🍼": "cup-straw", "🍅": "basket2-fill", "🥔": "basket2-fill",
    "🛞": "gear-wide", "🦓": "list", "🧦": "person-walking", "🧢": "person-badge", "👕": "person-badge", "👔": "person-badge-fill",
    "💍": "gem", "🧻": "file-earmark", "🖼": "image-fill", "🧗": "person-arms-up", "♻": "recycle", "🕺": "music-note-beamed",
    "👵": "person-heart", "🐻": "emoji-smile-fill", "🫧": "circle", "⛹": "dribbble", "🎂": "cake2-fill", "🎩": "magic",
    "🪝": "paperclip", "🌆": "buildings", "✳": "asterisk", "🐎": "arrow-right", "🗳": "box2-fill", "🏰": "building-fill",
    "🫗": "cup-straw", "🌀": "tornado", "🤱": "person-hearts", "🦁": "emoji-sunglasses", "📻": "broadcast-pin",
    "🪶": "feather", "🧎": "person-down", "🐇": "arrow-right", "🌳": "tree-fill", "🎦": "film", "📵": "phone-flip",
    "🤦": "emoji-dizzy", "👻": "emoji-wink", "🎒": "backpack-fill", "🌧": "cloud-rain-fill", "🧯": "fire",
    "🎉": "stars", "🧑‍🏫": "person-video3", "👩‍🏫": "person-video3", "👨‍🏫": "person-video3", "🏃‍♀": "person-walking",
    "⏱": "stopwatch-fill", "⬇": "arrow-down-circle-fill", "⏰": "alarm-fill", "⭕": "circle", "⏳": "hourglass-split",
    "〰": "water", "🧑‍💼": "person-workspace", "👩‍💼": "person-workspace", "⏸": "pause-circle-fill",
    "👨‍👩‍👧": "people-fill", "·": "dot", "ℹ": "info-circle-fill", "⏪": "rewind-fill", "▭": "square",
    "▶": "play-circle-fill", "⬜": "square", "⏩": "fast-forward-fill", "🧑‍🔧": "person-gear", "⏚": "plug-fill",
    "⌨": "keyboard-fill", "⬅": "arrow-left-circle-fill", "％": "percent", "🅱": "type-bold", "😮‍💨": "wind",
    "🇺🇸": "translate", "🇧🇷": "translate", "🇪🇸": "translate", "🆔": "person-vcard-fill", "🅰": "alphabet", "⧈": "square",
    "⛓‍💥": "scissors", "⬛": "square-fill", "⏹": "stop-circle-fill", "◻": "square", "⬡": "hexagon", "®": "r-circle",
    "🃏": "suit-spade-fill", "▦": "grid-3x3", "⤵": "arrow-return-right", "⊤": "diagram-2", "▫": "square", "🧑‍⚖": "bank2",
    "⏺": "record-circle-fill", "👨‍🍼": "person-hearts", "⤴": "arrow-90deg-up",
    "0": "0-circle-fill", "1": "1-circle-fill", "2": "2-circle-fill", "3": "3-circle-fill", "4": "4-circle-fill",
    "5": "5-circle-fill", "6": "6-circle-fill", "7": "7-circle-fill", "8": "8-circle-fill", "9": "9-circle-fill",
}


def normalizar(e: str) -> str:
    return e.replace("️", "").replace("⃣", "").strip()


def main():
    nomes = set(json.load(open(os.path.join(RAIZ, "node_modules/bootstrap-icons/font/bootstrap-icons.json"), encoding="utf-8")))
    ruins = {e: n for e, n in MAPA.items() if n not in nomes}
    if ruins:
        print("ícones inexistentes:", ruins)
        sys.exit(1)
    linhas = ",\n".join(f'  {json.dumps(normalizar(e), ensure_ascii=False)}: {json.dumps(n)}' for e, n in MAPA.items())
    ts = (
        "// GERADO por scripts/emoji-icones-mapa.py — não editar à mão.\n"
        "// Emoji (sem o seletor FE0F) -> nome do ícone no Bootstrap Icons. Usado por <IconeEmoji>.\n"
        f"export const EMOJI_ICONE: Record<string, string> = {{\n{linhas},\n}};\n"
    )
    open(os.path.join(RAIZ, "src/lib/emoji-icones.ts"), "w", encoding="utf-8").write(ts)
    print("ok:", len(MAPA), "emojis mapeados")


main()
