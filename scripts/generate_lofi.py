"""Original periodic lo-fi masters. Requires numpy, Python's wave module and ffmpeg (for lossless FLAC).
Notes, room tails and textures wrap around the musical cycle; no end fades.
Everything that spans time (echoes, EQ, modulation) is circular, so the loop seam is inaudible.
"""
from pathlib import Path
import json
import subprocess
import tempfile
import wave
import numpy as np

SR = 48000  # The usual native rate of sound cards: no resampling on playback.
BARS = 16
OUT = Path(__file__).resolve().parents[1] / 'public' / 'audio'
TRACKS = [
    ('midnight-lofi', 82, [[57,60,64,67],[53,57,60,64],[50,53,57,60],[55,59,62,65]], [76,74,72,69,72,71,69,67,69,72,74,71,69,67,64,67], 13),
    ('rainy-lofi', 76, [[60,63,67,70],[56,60,63,67],[58,62,65,69],[55,58,62,65]], [75,72,70,67,70,72,75,79,77,75,72,70,67,65,67,70], 19),
    ('coffee-lofi', 90, [[62,65,69,72],[59,62,65,69],[57,60,64,67],[60,64,67,71]], [74,76,77,74,72,69,67,69,72,74,76,72,69,67,65,69], 23),
]


def add_wrapped(buffer, seconds, sound, level):
    index = round(seconds * SR) % len(buffer)
    cursor = 0
    while cursor < len(sound):
        count = min(len(sound) - cursor, len(buffer) - index)
        buffer[index:index + count] += sound[cursor:cursor + count] * level
        cursor += count
        index = 0


def place(left, right, seconds, sound, level, pan=0.0):
    """Equal-power pan: -1 is left, 1 is right."""
    angle = (pan + 1) * np.pi / 4
    add_wrapped(left, seconds, sound, level * np.cos(angle))
    add_wrapped(right, seconds, sound, level * np.sin(angle))


def frequency(note, cents=0.0):
    return 440 * 2 ** ((note - 69 + cents / 100) / 12)


def epiano(note, duration, decay, cents=0.0):
    """FM electric piano: a bright tine attack that settles into a warm body."""
    t = np.arange(round(duration * SR)) / SR
    f = frequency(note, cents)
    index = 1.5 * np.exp(-t * 6) + .22
    body = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    tine = .06 * np.sin(2 * np.pi * 7.02 * f * t) * np.exp(-t * 18)
    sound = .82 * body + .1 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2.5) + tine
    envelope = (1 - np.exp(-t * 220)) * np.exp(-t * decay) * np.clip((duration - t) / .24, 0, 1)
    return (sound * envelope).astype(np.float32)


def bass(note, duration):
    t = np.arange(round(duration * SR)) / SR
    phase = 2 * np.pi * frequency(note) * t
    sound = np.tanh(1.6 * (np.sin(phase) + .22 * np.sin(2 * phase))) / np.tanh(1.6)
    envelope = (1 - np.exp(-t * 90)) * np.exp(-t * .9) * np.clip((duration - t) / .08, 0, 1)
    return (sound * envelope).astype(np.float32)


def percussion(rng, kind):
    duration = {'kick': .5, 'rim': .24, 'hat': .09}[kind]
    t = np.arange(round(duration * SR)) / SR
    if kind == 'kick':
        phase = 2 * np.pi * (47 * t + 70 * (1 - np.exp(-t * 24)) / 24)
        sound = np.tanh(1.4 * np.sin(phase) * np.exp(-t * 11)) + .25 * rng.standard_normal(len(t)) * np.exp(-t * 400)
    else:
        noise = rng.standard_normal(len(t))
        bright = noise - 1.6 * np.roll(noise, 1) + .64 * np.roll(noise, 2)  # second-order high-pass
        if kind == 'hat':
            sound = .5 * bright * np.exp(-t * 70)
        else:
            sound = .3 * bright * np.exp(-t * 38) + .5 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    # Every transient starts at zero; the loop has no artificial silence at its edge.
    return (sound * np.clip(t / .002, 0, 1) * np.clip((duration - t) / .02, 0, 1)).astype(np.float32)


def circular_eq(signal, gain):
    """Apply a frequency response to the whole cycle at once: circular by construction."""
    freqs = np.fft.rfftfreq(len(signal), 1 / SR)
    return np.fft.irfft(np.fft.rfft(signal, axis=0) * gain(freqs)[:, None], n=len(signal), axis=0).astype(np.float32)


def render(name, bpm, chords, melody, seed):
    rng = np.random.default_rng(seed)
    length = round(BARS * 4 * 60 / bpm * SR)
    beat = length / SR / (BARS * 4)  # All events share the same exact sample-length cycle.
    left = np.zeros(length, dtype=np.float32)
    right = np.zeros(length, dtype=np.float32)
    for bar in range(BARS):
        chord = chords[bar % len(chords)]
        start = bar * 4 * beat
        for i, note in enumerate(chord):
            pan = (-.45, -.15, .15, .45)[i]
            # Two slightly detuned copies, one per side, give a gentle chorus width.
            place(left, right, start + i * .009, epiano(note, 5.2 * beat, .42, -4), .05, pan - .2)
            place(left, right, start + i * .009 + .004, epiano(note, 5.2 * beat, .42, 4), .05, pan + .2)
        for pos in (0, 2):
            place(left, right, start + pos * beat, bass(chord[0] - 24, 1.75 * beat), .2)
        for pos in (0, 2.5 if bar % 2 else 2):
            place(left, right, start + pos * beat, percussion(rng, 'kick'), .2)
        for pos in (1, 3):
            place(left, right, start + pos * beat + .012, percussion(rng, 'rim'), .05, .12)
        for eighth in range(8):
            swing = .045 * beat if eighth % 2 else 0
            place(left, right, start + eighth * beat / 2 + swing, percussion(rng, 'hat'), .02 if eighth % 2 else .028, .3 if eighth % 2 else -.3)
        for j, pos in enumerate((.5, 1.5, 2.5, 3.5)):
            if (bar + j) % 4 == 0:
                continue
            note = melody[(bar * 2 + j) % len(melody)]
            place(left, right, start + pos * beat + .015, epiano(note, 1.4 * beat, 2.2, (j - 1.5) * 2), .05, .25)
    stereo = np.column_stack((left, right))
    # Independent noise per side: rain on the window, or a soft vinyl bed with sparse crackle.
    texture = rng.normal(0, .006 if name == 'rainy-lofi' else .0025, (length, 2)).astype(np.float32)
    texture = circular_eq(texture, lambda f: (f > 400) / np.sqrt(1 + (f / 6000) ** 2))
    if name != 'rainy-lofi':
        clicks = np.zeros((length, 2), dtype=np.float32)
        for at in rng.integers(0, length, size=int(length / SR * 3)):
            clicks[at, rng.integers(0, 2)] = rng.uniform(.02, .06)
        texture += circular_eq(clicks, lambda f: 1 / np.sqrt(1 + (f / 4000) ** 2))
    stereo += texture
    stereo *= (1 + .012 * np.sin(np.arange(length) / length * 2 * np.pi * 4))[:, None]
    # Room: decorrelated echo taps per side, darker than the dry signal.
    wet = np.zeros_like(stereo)
    for delay, gain in ((.11, .2), (.23, .15), (.37, .11), (.53, .08), (.79, .05)):
        wet[:, 0] += np.roll(stereo[:, 1], round(delay * SR)) * gain
        wet[:, 1] += np.roll(stereo[:, 0], round((delay + .017) * SR)) * gain
    stereo += circular_eq(wet, lambda f: 1 / np.sqrt(1 + (f / 4500) ** 4))
    # Master EQ: no sub-bass rumble, a soft lo-fi roll-off from 11 kHz instead of a hard muffle.
    stereo = circular_eq(stereo, lambda f: (f / 28) ** 2 / (1 + (f / 28) ** 2) / np.sqrt(1 + (f / 11000) ** 4))
    stereo = np.tanh(stereo * 1.25) / 1.25  # gentle tape-like saturation
    # Loudness about -14 dBFS RMS; a soft limiter keeps every peak under -1 dBFS.
    stereo *= .2 / max(float(np.sqrt(np.mean(stereo ** 2))), 1e-9)
    ceiling = .89
    stereo = ceiling * np.tanh(stereo / ceiling)
    dither = (rng.random(stereo.shape) - rng.random(stereo.shape)) / 32768  # TPDF, removes quantization distortion in quiet tails
    pcm = np.clip(np.round((stereo + dither) * 32767), -32768, 32767).astype('<i2')
    with tempfile.TemporaryDirectory() as folder:
        master = Path(folder) / f'{name}.wav'
        with wave.open(str(master), 'wb') as output:
            output.setnchannels(2)
            output.setsampwidth(2)
            output.setframerate(SR)
            output.writeframes(pcm.tobytes())
        # FLAC is lossless: exactly the same samples at about 60 % of the WAV size.
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(master), '-compression_level', '12', str(OUT / f'{name}.flac')], check=True)
    return {'name': name, 'sampleRate': SR, 'frames': length, 'channels': 2, 'seconds': length / SR, 'peak': float(np.max(np.abs(stereo))), 'rms': float(np.sqrt(np.mean(stereo ** 2))), 'seamJump': float(np.max(np.abs(stereo[0] - stereo[-1])))}


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for spec in TRACKS:
        print(json.dumps(render(*spec)))
