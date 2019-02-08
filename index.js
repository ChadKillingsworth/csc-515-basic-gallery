/** @enum */
const Direction = {
  FORWARD: 1,
  BACKWARD: 2,
  LEFT: 3,
  RIGHT: 4,
  UP: 5,
  DOWN: 6
};

/**
 * Loosely based concepts from the SwipeJS library
 * Refactored to be compatible with Closure tools and to
 * use events in lieu of callback options.
 */
class BasicGallery {
  
  /**
   * @param {!Element} container
   * @param {{
   *     startSlide: (number|undefined),
   *     continuous: (boolean|undefined),
   *     speed: (number|undefined)
   *   }=} options
   */
  constructor(container, options) {
    if (!container) {
      return;
    }
    
    var supportsTouch = true; // 'ontouchstart' in window;

    this.container = container;
    this.options = options || {};
    this.options.startSlide = this.options.startSlide || 0;
    this.index = parseInt(this.options.startSlide, 10) || 0;
    this.speed = this.options.speed || 300;
    this.options.continuous = this.options.continuous !== undefined ?
        this.options.continuous : true;

    // cache slides
    this.slides = this.container.children;
    this.length = this.slides.length;

    // set continuous to false if only one slide
    if (this.slides.length < 2) {
      this.options.continuous = false;
    }

    //special case if two slides
    if (this.options.continuous && this.slides.length < 3) {
      this.container.appendChild(this.slides[0].cloneNode(true));
      this.container.appendChild(this.container.children[1].cloneNode(true));
      this.slides = this.container.children;
    }

    // create an array to store current positions of each slide
    this.slidePos = new Array(this.slides.length);

    this.initialize();

    this.container.style.visibility = 'visible';

    this.boundSlideChanged = this.slideChanged.bind(this);

    if (supportsTouch) {
      this.container.addEventListener('touchstart', this.touchstart.bind(this), false);
      this.container.addEventListener('touchmove', this.touchmove.bind(this), false);
      this.container.addEventListener('touchend', this.touchend.bind(this), false);
    }

    window.addEventListener('resize', this.resize.bind(this), false);
  }

  initialize() {
    this.resizeTimeout = -1;

    // determine width of each slide
    this.width = this.container.getBoundingClientRect().width ||
        this.container.offsetWidth;

    // stack elements
    var pos = this.slides.length, slide;
    while(pos--) {
      slide = this.slides[pos];

      slide.style.width = this.width + 'px';
      slide.setAttribute('data-index', pos);

      this.moveSlideAtIndex(pos, this.index > pos ? -this.width :
          (this.index < pos ? this.width : 0), 0);
    }

    // reposition elements before and after index
    if (this.options.continuous) {
      this.moveSlideAtIndex(this.wrapIndex(this.index - 1), -this.width, 0);
      this.moveSlideAtIndex(this.wrapIndex(this.index + 1), this.width, 0);
    }
  }

    prev() {
    if (this.options.continuous || this.index > 0) {
      this.slide(this.index - 1);
    }
  }

  next() {
    if (this.options.continuous || this.index < this.slides.length - 1) {
      this.slide(this.index + 1);
    }
  }

  /**
   * a simple positive modulo using this.slides.length
   *
   * @param {number} index
   * @return {number}
   */
  wrapIndex(index) {
    return (this.slides.length + (index % this.slides.length)) %
        this.slides.length;
  }

  /**
   * @param {number} index
   * @param {number} distance
   * @param {number} speed
   */
  moveSlideAtIndex(index, distance, speed) {
    this.translate(index, distance, speed);
    this.slidePos[index] = distance;
  }

  /**
   * @param {number} destinationIndex
   * @param {number=} slideSpeed
   * @param {boolean=} ignoreWrap
   */
  slide(destinationIndex, slideSpeed, ignoreWrap) {

    // do nothing if already on requested slide
    if (this.index === destinationIndex) {
      return;
    }

    var needsDelay = false;
    if (this.resetSlideTimeout > 0) {
      this.boundResetSlide();
      needsDelay = true;
    }

    if (this.options.continuous && ignoreWrap === true &&
        ((destinationIndex === 0 && this.slidePos[0] > 0) ||
        (destinationIndex === this.slides.length - 1 &&
        this.slidePos[destinationIndex] < 0))) {
      this.moveSlideAtIndex(destinationIndex,
          (destinationIndex === 0 ? -1 : 1) * this.width, 0);
      needsDelay = true;
    }
    if (needsDelay) {
      setTimeout(
          this.slide.bind(this, destinationIndex, slideSpeed, ignoreWrap),
          10);
      return;
    }

    slideSpeed = slideSpeed !== undefined && slideSpeed >= 0 ?
        slideSpeed : this.speed;

    var direction, natural_direction, directionFactor;

    direction = (Math.abs(this.index - destinationIndex) /
        (this.index - destinationIndex)) < 0 ?
        Direction.FORWARD : Direction.BACKWARD;

    // get the actual position of the slide
    if (this.options.continuous && ignoreWrap !== true) {
      natural_direction = direction;
      direction =
          (-this.slidePos[this.wrapIndex(destinationIndex)] / this.width) < 0 ?
          Direction.FORWARD : Direction.BACKWARD;

      directionFactor = direction === Direction.FORWARD ? -1 : 1;

      // if going forward but to < index, use to = slides.length + to
      // if going backward but to > index, use to = -slides.length + to
      if (direction !== natural_direction){
        destinationIndex = directionFactor * this.slides.length +
            destinationIndex;
      }
    } else {
      directionFactor = direction === Direction.FORWARD ? -1 : 1;
      if (this.options.continuous) {
        if (destinationIndex === 0 && this.slidePos[destinationIndex] > 0) {
          this.moveSlideAtIndex(destinationIndex, -this.width, 0);
        } else if (destinationIndex === this.slides.length - 1 &&
            this.slidePos[destinationIndex] < 0) {
          this.moveSlideAtIndex(destinationIndex, this.width, 0);
        }
      }
    }

    var diff = Math.abs(this.index - destinationIndex) - 1;

    // move all the slides between index and destinationIndex in the
    // correct direction
    while (diff--) {
      this.moveSlideAtIndex(
          this.wrapIndex((destinationIndex > this.index ?
              destinationIndex : this.index) - diff - 1),
          this.width * directionFactor, 0);
    }

    destinationIndex = this.wrapIndex(destinationIndex);

    this.moveSlideAtIndex(this.index, this.width * directionFactor, slideSpeed);
    this.moveSlideAtIndex(destinationIndex, 0, slideSpeed);

    if (this.options.continuous) {
      this.resetSlideTimeout = -1;
      this.resetSlide(this.wrapIndex(destinationIndex - directionFactor),
          -this.width * directionFactor, slideSpeed);
    }

    this.index = destinationIndex;
    setTimeout(this.boundSlideChanged, 10);
  }

  /**
   * @param {number} index
   * @param {number} offset
   * @param {number=} delay in milliseconds
   */
  resetSlide(index, offset, delay) {
    if (delay !== undefined && delay > 0 && this.resetSlideTimeout < 0) {
      this.boundResetSlide = this.resetSlide.bind(this, index, offset);
      this.resetSlideTimeout = setTimeout(this.boundResetSlide, delay);
    } else {
      if (this.resetSlideTimeout > 0) {
        clearTimeout(this.resetSlideTimeout);
      }
      this.resetSlideTimeout = -1;
      this.boundResetSlide = undefined;
      this.moveSlideAtIndex(index, offset, 0);
    }
  }

  /**
   * @param {number} index
   * @param {number} distance
   * @param {number} speed
   */
  translate(index, distance, speed) {
    var slide = this.slides[index];

    if (!slide || !slide.style) {
      return;
    }

    slide.style.transitionDuration = speed + 'ms';
    slide.style.left = distance + 'px';
  }

  /*
  * Called whenever the slide index is changed. Override in derived classes
  * to add specific handling.
  */
  slideChanged() {};

  /** @param {Event} event */
  touchstart(event) {
    this.validTouchEvent = true;
    var touches = event.touches[0];

    // measure start values
    this.touchStartData = {
      // get initial touch coords
      x: touches.pageX,
      y: touches.pageY,

      // store time to determine touch duration
      time: +new Date
    };

    // used for testing first move event
    this.isScrolling = undefined;

    // reset delta and end measurements
    this.touchDelta = {};

    if (this.resetSlideTimeout > 0) {
      this.boundResetSlide();
    }
  }

  /** @param {Event} event */
  touchmove(event) {
    if (!this.validTouchEvent) {
      return;
    }
    // ensure swiping with one touch and not pinching
    if (event.touches.length > 1 ||
        event.scale && event.scale !== 1)  {
      return;
    }

    var touches = event.touches[0];

    // measure change in x and y
    this.touchDelta = {
      x: touches.pageX - this.touchStartData.x,
      y: touches.pageY - this.touchStartData.y
    };

    // determine if scrolling test has run - one time test
    if (this.isScrolling === undefined) {
      this.isScrolling = Math.abs(this.touchDelta.x) <
          Math.abs(this.touchDelta.y);
    }

    // if user is not trying to scroll vertically
    if (!this.isScrolling) {
      // prevent native scrolling
      event.preventDefault();

      // increase resistance if first or last slide
      if (this.options.continuous) { // we don't add resistance at the end
        this.translate(this.wrapIndex(this.index - 1),
            this.touchDelta.x + this.slidePos[this.wrapIndex(this.index - 1)], 0);
        this.translate(this.index, this.touchDelta.x + this.slidePos[this.index],
            0);
        this.translate(this.wrapIndex(this.index + 1),
            this.touchDelta.x + this.slidePos[this.wrapIndex(this.index + 1)], 0);
      } else {
        this.touchDelta.x =
            this.touchDelta.x / (
                (!this.index && this.touchDelta.x > 0 ||  // if first slide and sliding left
                this.index === this.slides.length - 1 && // or if last slide and sliding right
                this.touchDelta.x < 0) ?                      // and if sliding at all?
                (Math.abs(this.touchDelta.x) / this.width + 1 )      // determine resistance level
                : 1);                                 // no resistance if false

        // translate 1:1
        this.translate(this.index - 1, this.touchDelta.x +
            this.slidePos[this.index - 1], 0);
        this.translate(this.index, this.touchDelta.x +
            this.slidePos[this.index], 0);
        this.translate(this.index + 1, this.touchDelta.x +
            this.slidePos[this.index + 1], 0);
      }
    }
  }

  /** @param {Event} evt */
  touchend(evt) {
    if (!this.validTouchEvent) {
      return;
    }

    this.validTouchEvent = false;

    setTimeout(this.afterTouchend.bind(this, evt), 10);
  }

  /** @param {Event} evt */
  afterTouchend(evt) {
    // measure duration
    var duration = +new Date - this.touchStartData.time;

    // determine if slide attempt triggers next/prev slide
    var isValidSlide =
        Number(duration) < 250               // if slide duration is less than 250ms
        && Math.abs(this.touchDelta.x) > 20            // and if slide amt is greater than 20px
        || Math.abs(this.touchDelta.x) > this.width/2;      // or if slide amt is greater than half the width

    // determine if slide attempt is past start and end
    var isPastBounds =
        !this.index && this.touchDelta.x > 0 ||                           // if first slide and slide amt is greater than 0
        this.index == this.slides.length - 1 && this.touchDelta.x < 0;    // or if last slide and slide amt is less than 0

    if (this.options.continuous) {
      isPastBounds = false;
    }

    var direction = this.touchDelta.x < 0 ? Direction.RIGHT :
        Direction.LEFT;

    // if not scrolling vertically
    if (!this.isScrolling) {
      if (isValidSlide && !isPastBounds) {
        if (direction === Direction.RIGHT) {
          this.index = this.wrapIndex(this.index + 1);
        } else {
          this.index = this.wrapIndex(this.index - 1);
        }
      }
      this.moveSlideAtIndex(this.index, 0, this.speed);

      if (this.options.continuous) {
        this.moveSlideAtIndex(this.wrapIndex(this.index - 1), -this.width,
            direction === Direction.RIGHT ? this.speed : 0);
        this.moveSlideAtIndex(this.wrapIndex(this.index + 1), this.width,
            direction === Direction.LEFT ? this.speed : 0);
      } else if (direction === Direction.RIGHT) {
        this.moveSlideAtIndex(this.index - 1, -this.width, this.speed);
        if (this.index < this.slides.length - 1) {
          this.moveSlideAtIndex(this.index + 1, this.width, 0);
        }
      } else {
        if (this.index > 0) {
          this.moveSlideAtIndex(this.index - 1, -this.width, 0);
        }
        this.moveSlideAtIndex(this.index + 1, this.width, this.speed);
      }

      this.slideChanged();
    }
  }

  /** @param {Event} evt */
  resize(evt) {
    if (this.resizeTimeout < 0) {
      this.resizeTimeout = setTimeout(this.initialize.bind(this), 100);
    }
  }
}

/** @const */
BasicGallery.Direction = Direction;
module.exports = BasicGallery;
