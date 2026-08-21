# ThenNow

Drop a before image and an after image. Get a swipe comparison. Files never leave the browser.

Ask this answers: [Simple Before/After Tool?](https://www.reddit.com/r/openstreetmap/comments/1vk5uid/simple_beforeafter_tool/)

- No account
- No upload
- Cap: 8 MB each, 2 images
- PNG, JPEG, WebP, GIF
- Does not fetch OSM history tiles. You still supply two frames.

## Local

Open `index.html` in a browser, or:

```bash
python3 -m http.server 4173
```

If you never screenshot the old map, export the current view, then grab an archived frame from OSM history or a Wayback snapshot of the same bbox.

## GTM

Reply to people who already mapped a place and still line up two screenshots by hand. Copy is in the page footer.
