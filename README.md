# Basic Gallery

## Usage
```js
const BasicGallery = require('csc-adv-int-basic-gallery');

document.addEventListener('DOMContentLoaded', () => {
  const base = document.getElementsByClassName('gallery')[0];
  const containerWidth = base.getBoundingClientRect().width;
  // 500 / 375 = containerWidth / X
  const displayHeight = Math.round((containerWidth * 375) / 500);
  base.style.height = "" + displayHeight + "px";
  const gallery = new BasicGallery(base.getElementsByClassName('full-images')[0]);
}, false);
```

## Public Methods
```js
/**
 * @param {!Element} container
 * @param {{
 *     startSlide: (number|undefined),
 *     continuous: (boolean|undefined),
 *     speed: (number|undefined)
 *   }=} options
 */
constructor(container, options) { }

/** 
 * Advance to the next image
 */
next() { }

/**
 * a simple positive modulo using this.slides.length
 *
 * @param {number} index
 * @return {number}
 */
wrapIndex(index) { }

/**
 * @param {number} destinationIndex
 * @param {number=} slideSpeed
 * @param {boolean=} ignoreWrap
 */
slide(destinationIndex, slideSpeed, ignoreWrap) {}

/**
 * @param {number} index
 * @param {number} offset
 * @param {number=} delay in milliseconds
 */
resetSlide(index, offset, delay) {}

/*
* Called whenever the slide index is changed. Override in derived classes
* to add specific handling.
*/
slideChanged() {};
```
