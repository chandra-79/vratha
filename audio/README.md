# Spoken mantra guides

The five `.m4a` files are synthetic spoken guides, generated locally using the macOS Hindi voice **Lekha** at 105 words per minute and converted to AAC with `afconvert`. They are not recordings of a singer or traditional Vedic recitation. The interface labels them accordingly.

Each file contains exactly one repetition of the matching Devanagari text in `practices.js`. The audio player repeats it up to the shared daily target; only a completed recording increments the selected practice's count.

Example generation:

```sh
say -v Lekha -r 105 -o /tmp/rama.aiff 'ॐ श्री रामाय नमः।'
afconvert -f m4af -d aac /tmp/rama.aiff audio/rama.m4a
```

Text references:

- Rama, Hanuman, Shiva, and Durga: [The Divine Life Society — Mantras for Japa](https://www.dlshq.org/teachings/japa-yoga/)
- Gayatri: [Sri Sathya Sai International Organization — Gayatri Mantra](https://www.sathyasai.org/gayatri-mantra)

The short English meaning descriptions are summaries. Telugu is a script rendering of the corresponding mantra. Ganapati's existing recordings and reference sheets remain separate and unchanged.
