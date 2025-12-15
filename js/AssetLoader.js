export class AssetLoader {
    constructor() {
        this.images = {};
        this.audio = {};
        this.sprites = {};
        this.animations = {};
        this.loaded = 0;
        this.total = 0;
    }

    async loadImages(imagePaths) {
        const promises = Object.entries(imagePaths).map(([key, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.images[key] = img;
                    this.loaded++;
                    console.log(`Loaded image: ${key}`);
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error(`Failed to load image: ${key}`, e);
                    // Resolve with null to avoid breaking Promise.all, but log error
                    resolve(null);
                };
            });
        });

        this.total += promises.length;
        await Promise.all(promises);
        return this.images;
    }

    get(key) {
        return this.images[key];
    }

    // Define a single sprite frame
    defineSprite(name, imageKey, x, y, width, height) {
        if (!this.images[imageKey]) {
            console.error(`Image key '${imageKey}' not found when defining sprite '${name}'`);
            return;
        }
        this.sprites[name] = {
            image: this.images[imageKey],
            x, y, width, height
        };
    }

    // Define an animation (sequence of sprite names)
    defineAnimation(name, frameNames, frameDuration) {
        this.animations[name] = {
            frames: frameNames,
            frameDuration: frameDuration // frames per sprite
        };
    }

    getSprite(name) {
        return this.sprites[name];
    }

    getAnimation(name) {
        return this.animations[name];
    }
}
