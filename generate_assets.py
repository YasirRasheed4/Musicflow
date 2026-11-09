import os
import math
import random
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
AUDIO_DIR = os.path.join(BASE, "audio")
COVER_DIR = os.path.join(BASE, "covers")
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(COVER_DIR, exist_ok=True)

SR = 22050

# ---------- audio synthesis ----------

def midi_to_freq(m):
    return 440.0 * (2 ** ((m - 69) / 12.0))

def adsr(n, a=0.08, d=0.1, s=0.7, r=0.25):
    a_n, d_n, r_n = int(n * a), int(n * d), int(n * r)
    s_n = max(n - a_n - d_n - r_n, 0)
    parts = [
        np.linspace(0, 1, a_n, endpoint=False),
        np.linspace(1, s, d_n, endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, r_n, endpoint=True),
    ]
    env = np.concatenate([p for p in parts if len(p)])
    if len(env) < n:
        env = np.concatenate([env, np.zeros(n - len(env))])
    return env[:n]

def synth_note(freq, dur, harmonics, vibrato=0.0):
    n = max(int(SR * dur), 1)
    t = np.linspace(0, dur, n, endpoint=False)
    vib = np.sin(2 * np.pi * 5 * t) * vibrato
    sig = np.zeros(n)
    for mult, amp in harmonics:
        sig += amp * np.sin(2 * np.pi * freq * mult * t + vib)
    return sig * adsr(n)

def synth_rest(dur):
    return np.zeros(max(int(SR * dur), 1))

def make_melody(root_midi, scale, tempo_bpm, length, seed):
    rnd = random.Random(seed)
    beat = 60.0 / tempo_bpm
    durs = [beat * 0.5, beat * 0.5, beat * 1.0, beat * 0.5, beat * 1.5]
    idx = 0
    out = []
    for _ in range(length):
        idx = max(0, min(len(scale) * 2 - 1, idx + rnd.choice([-2, -1, -1, 0, 1, 1, 2])))
        degree = scale[idx % len(scale)] + 12 * (idx // len(scale))
        freq = midi_to_freq(root_midi + degree)
        d = rnd.choice(durs)
        out.append((None if rnd.random() < 0.08 else freq, d))
    return out

def render(notes, harmonics, vibrato):
    chunks = [synth_rest(d) if f is None else synth_note(f, d, harmonics, vibrato) for f, d in notes]
    return np.concatenate(chunks) if chunks else np.zeros(SR)

def loop_to_length(sig, target_sec):
    target_n = int(target_sec * SR)
    reps = int(np.ceil(target_n / len(sig)))
    out = np.tile(sig, reps)[:target_n]
    fade_n = int(min(1.2, target_sec * 0.15) * SR)
    out[-fade_n:] *= np.linspace(1, 0, fade_n)
    fin = int(0.03 * SR)
    out[:fin] *= np.linspace(0, 1, fin)
    return out

def add_bass(sig, root_midi, tempo_bpm, level=0.18):
    beat = 60.0 / tempo_bpm
    bass_freq = midi_to_freq(root_midi - 12)
    n_beats = int(len(sig) / SR / beat) + 2
    bass = np.concatenate([synth_note(bass_freq, beat, ((1, 0.8), (2, 0.1)), 0) for _ in range(n_beats)])[:len(sig)]
    return sig + bass * level

def add_noise(sig, level=0.015):
    return sig + np.random.default_rng(7).normal(0, 1, len(sig)) * level

def write_wav(path, sig):
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * 0.85
    pcm = (sig * 32767).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

GENRES = {
    "synthwave": dict(scale=[0, 3, 5, 7, 10, 12], tempo=120, harmonics=((1, 0.5), (2, 0.3), (3, 0.2)), vibrato=0.0, bass=True, noise=False),
    "folk":      dict(scale=[0, 2, 4, 7, 9, 12], tempo=92, harmonics=((1, 0.7), (2, 0.2), (3, 0.05)), vibrato=0.15, bass=False, noise=False),
    "lofi":      dict(scale=[0, 3, 7, 10, 12], tempo=76, harmonics=((1, 0.6), (2, 0.15)), vibrato=0.0, bass=True, noise=True),
    "pop":       dict(scale=[0, 2, 4, 5, 7, 9, 11, 12], tempo=112, harmonics=((1, 0.55), (2, 0.3), (3, 0.1)), vibrato=0.0, bass=True, noise=False),
}

TRACKS = [
    ("neon-tide.wav", "neon-tide", "synthwave", 57, 16, 1),
    ("chrome-horizon.wav", "neon-tide", "synthwave", 60, 15, 2),
    ("night-drive.wav", "neon-tide", "synthwave", 55, 17, 3),
    ("afterglow.wav", "afterglow", "synthwave", 62, 14, 4),
    ("static-bloom.wav", "afterglow", "synthwave", 59, 15, 5),
    ("quiet-hollow.wav", "quiet-hollow", "folk", 60, 16, 6),
    ("pine-and-ash.wav", "quiet-hollow", "folk", 57, 14, 7),
    ("slow-river.wav", "quiet-hollow", "folk", 55, 18, 8),
    ("3am-static.wav", "3am-static", "lofi", 58, 16, 9),
    ("dial-tone-dreams.wav", "3am-static", "lofi", 53, 15, 10),
    ("paper-weather.wav", "paper-weather", "pop", 62, 14, 11),
    ("umbrella-song.wav", "paper-weather", "pop", 64, 13, 12),
    ("static-skyline.wav", "paper-weather", "pop", 60, 15, 13),
]

for fname, album_key, genre, root, dur, seed in TRACKS:
    g = GENRES[genre]
    notes = make_melody(root, g["scale"], g["tempo"], 24, seed)
    sig = render(notes, g["harmonics"], g["vibrato"])
    sig = loop_to_length(sig, dur)
    if g["bass"]:
        sig = add_bass(sig, root, g["tempo"])
    if g["noise"]:
        sig = add_noise(sig)
    write_wav(os.path.join(AUDIO_DIR, fname), sig)
    print("audio:", fname)

# ---------- cover art ----------

def make_gradient(w, h, c1, c2, diagonal=True):
    c1, c2 = np.array(c1, dtype=float), np.array(c2, dtype=float)
    yy, xx = np.mgrid[0:h, 0:w]
    t = ((xx + yy) / (w + h)) if diagonal else (yy / h)
    t = t[..., None]
    return (c1 * (1 - t) + c2 * t).astype(np.uint8)

def fit_font(draw, text, path, max_width, start_size):
    size = start_size
    while size > 10:
        font = ImageFont.truetype(path, size)
        if draw.textbbox((0, 0), text, font=font)[2] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(path, 10)

def make_cover(path, title, artist, c1, c2, grain, size=600):
    arr = make_gradient(size, size, c1, c2)
    img = Image.fromarray(arr, mode="RGB").convert("RGBA")
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([size * 0.55, -size * 0.15, size * 1.35, size * 0.65], fill=(255, 255, 255, 28))
    od.ellipse([-size * 0.25, size * 0.55, size * 0.45, size * 1.25], fill=(0, 0, 0, 40))
    img = Image.alpha_composite(img, overlay)
    if grain:
        noise = (np.random.default_rng(3).normal(0, 1, (size, size)) * 14).astype(np.int16)
        base = np.clip(np.array(img.convert("RGB")).astype(np.int16) + noise[..., None], 0, 255).astype(np.uint8)
        img = Image.fromarray(base, "RGB").convert("RGBA")
    scrim = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    band = int(size * 0.42)
    for i in range(band):
        alpha = int(160 * (i / band) ** 1.4)
        sd.line([(0, size - band + i), (size, size - band + i)], fill=(10, 6, 16, alpha))
    img = Image.alpha_composite(img, scrim)
    draw = ImageDraw.Draw(img)
    pad = int(size * 0.07)
    title_font = fit_font(draw, title, "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", size - 2 * pad, int(size * 0.09))
    artist_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(size * 0.04))
    draw.text((pad, size - pad - int(size * 0.135)), title, font=title_font, fill=(245, 239, 234, 255))
    draw.text((pad, size - pad - int(size * 0.045)), artist.upper(), font=artist_font, fill=(225, 216, 232, 215))
    img.convert("RGB").save(path, quality=92)

ALBUM_COVERS = [
    ("neon-tide.png", "Neon Tide", "Nova Ember", (43, 16, 85), (255, 111, 145), False),
    ("afterglow.png", "Afterglow", "Nova Ember", (61, 26, 82), (242, 192, 120), False),
    ("quiet-hollow.png", "Quiet Hollow", "Cedar & Vine", (58, 74, 63), (91, 58, 92), False),
    ("3am-static.png", "3AM Static", "Midnight Transit", (22, 24, 41), (123, 109, 147), True),
    ("paper-weather.png", "Paper Weather", "The Paper Cranes", (242, 192, 120), (255, 111, 145), False),
]

for fname, title, artist, c1, c2, grain in ALBUM_COVERS:
    make_cover(os.path.join(COVER_DIR, fname), title, artist, c1, c2, grain)
    print("cover:", fname)

print("done")
