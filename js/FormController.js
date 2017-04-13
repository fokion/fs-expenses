'use strict';

var support = {animations: Modernizr.cssanimations},
    animEndEventNames = {
        'WebkitAnimation': 'webkitAnimationEnd',
        'OAnimation': 'oAnimationEnd',
        'msAnimation': 'MSAnimationEnd',
        'animation': 'animationend'
    },
    // animation end event name
    animEndEventName = animEndEventNames[Modernizr.prefixed('animation')];

/**
 * extend obj function
 */
function extend(a, b) {
    for (var key in b) {
        if (b.hasOwnProperty(key)) {
            a[key] = b[key];
        }
    }
    return a;
}

/**
 * createElement function
 * creates an element with tag = tag, className = opt.cName, innerHTML = opt.inner and appends it to opt.appendTo
 */
function createElement(tag, opt) {
    var el = document.createElement(tag)
    if (opt) {
        if (opt.cName) {
            el.className = opt.cName;
        }
        if (opt.inner) {
            el.innerHTML = opt.inner;
        }
        if (opt.appendTo) {
            opt.appendTo.appendChild(el);
        }
    }
    return el;
}

/**
 * FormController function
 */
function FormController(el, options) {
    var me = this;
    me.state = {};
    me.inputs = document.querySelectorAll('[data-form-option]');
    this.el = el;
    this.options = extend({}, this.options);
    extend(this.options, options);
    this._init();
}

/**
 * FormController options
 */
FormController.prototype.options = {
    // show progress bar
    ctrlProgress: true,
    // show navigation dots
    ctrlNavDots: true,
    // show [current field]/[total fields] status
    ctrlNavPosition: true,
    // reached the review and submit step
    onReview: function () {
        return false;
    },

};
FormController.prototype.getCurrentState = function () {

    var stateObj = {};
    for (var i = 0; i < this.inputs.length; i++) {
        var inputElement = this.inputs[i];
        stateObj[inputElement.getAttribute('data-form-option')] = inputElement.value;
    }
    return stateObj;
}

/**
 * init function
 * initialize and cache some vars
 */
FormController.prototype._init = function () {
    // the form element
    this.formEl = this.el.querySelector('form');

    // list of fields
    this.fieldsList = this.formEl.querySelector('ol.fs-fields');

    // current field position
    this.current = 0;

    // all fields
    this.fields = [].slice.call(this.fieldsList.children);

    // total fields
    this.fieldsCount = this.fields.length;

    // show first field
    classie.add(this.fields[this.current], 'fs-current');

    // create/add controls
    this._addControls();

    // init events
    this._initEvents();
};

/**
 * addControls function
 * create and insert the structure for the controls
 */
FormController.prototype._addControls = function () {
    // main controls wrapper
    this.ctrls = createElement('div', {cName: 'fs-controls', appendTo: this.el});

    // continue button (jump to next field)
    this.ctrlContinue = createElement('button', {cName: 'fs-continue', inner: '<i class="material-icons">keyboard_arrow_right</i>', appendTo: this.ctrls});
    this._showCtrl(this.ctrlContinue);

    // navigation dots
    if (this.options.ctrlNavDots) {
        this.ctrlNav = createElement('nav', {cName: 'fs-nav-dots', appendTo: this.ctrls});
        var dots = '';
        for (var i = 0; i < this.fieldsCount; ++i) {
            dots += i === this.current ? '<button class="fs-dot-current"></button>' : '<button disabled></button>';
        }
        this.ctrlNav.innerHTML = dots;
        this._showCtrl(this.ctrlNav);
        this.ctrlNavDots = [].slice.call(this.ctrlNav.children);
    }

    // field number status
    if (this.options.ctrlNavPosition) {
        this.ctrlFldStatus = createElement('span', {cName: 'fs-numbers', appendTo: this.ctrls});

        // current field placeholder
        this.ctrlFldStatusCurr = createElement('span', {cName: 'fs-number-current', inner: Number(this.current + 1)});
        this.ctrlFldStatus.appendChild(this.ctrlFldStatusCurr);

        // total fields placeholder
        this.ctrlFldStatusTotal = createElement('span', {cName: 'fs-number-total', inner: this.fieldsCount});
        this.ctrlFldStatus.appendChild(this.ctrlFldStatusTotal);
        this._showCtrl(this.ctrlFldStatus);
    }

    // progress bar
    if (this.options.ctrlProgress) {
        this.ctrlProgress = createElement('div', {cName: 'fs-progress', appendTo: this.ctrls});
        this._showCtrl(this.ctrlProgress);
    }
}

/**
 * addErrorMsg function
 * create and insert the structure for the error message
 */
FormController.prototype._addErrorMsg = function () {
    // error message
    this.msgError = createElement('span', {cName: 'fs-message-error', appendTo: this.el});
}

/**
 * init events
 */
FormController.prototype._initEvents = function () {
    var self = this;

    // show next field
    this.ctrlContinue.addEventListener('click', function () {
        self._nextField();
    });

    // navigation dots
    if (this.options.ctrlNavDots) {
        this.ctrlNavDots.forEach(function (dot, pos) {
            dot.addEventListener('click', function () {
                self._showField(pos);
            });
        });
    }

    document.getElementById('submit-btn').onclick = this.options.onReview;
    // jump to next field without clicking the continue button (for fields/list items with the attribute "data-input-trigger")
    this.fields.forEach(function (fld) {
        if (fld.hasAttribute('data-input-trigger')) {
            var input = fld.querySelector('input[type="radio"]') || fld.querySelector('select');
            if (!input) return;

            if (input.tagName.toLowerCase() === 'select') {
                input.addEventListener('change', function () {
                    self._nextField();
                });
            }
        }
    });

    // keyboard navigation events - jump to next field when pressing enter
    document.addEventListener('keydown', function (ev) {
        if (!self.isLastStep && ev.target.tagName.toLowerCase() !== 'textarea') {
            var keyCode = ev.keyCode || ev.which;
            if (keyCode === 13) {
                ev.preventDefault();
                if (!this.isLastStep) {
                    self._nextField();
                } else {
                    this.options.onReview();
                }
            }
        }
    });
};

/**
 * nextField function
 * jumps to the next field
 */
FormController.prototype._nextField = function (backto) {
    if (this.inputs[this.current].value === "") {
        return;
    } else {
        this.inputs[this.current].blur();
    }
    if (this.isLastStep || this.isAnimating) {

        return;
    }
    this.isAnimating = true;

    // check if on last step
    this.isLastStep = this.current === this.fieldsCount - 1 && backto === undefined ? true : false;

    // current field
    var currentFld = this.fields[this.current];

    // save the navigation direction
    this.navdir = backto !== undefined ? backto < this.current ? 'prev' : 'next' : 'next';

    // update current field
    this.current = backto !== undefined ? backto : this.current + 1;

    if (backto === undefined) {
        // update progress bar (unless we navigate backwards)
        this._progress();

    }

    // add class "fs-display-next" or "fs-display-prev" to the list of fields
    classie.add(this.fieldsList, 'fs-display-' + this.navdir);

    // remove class "fs-current" from current field and add it to the next one
    // also add class "fs-show" to the next field and the class "fs-hide" to the current one
    classie.remove(currentFld, 'fs-current');
    classie.add(currentFld, 'fs-hide');

    if (!this.isLastStep) {
        // update nav
        this._updateNav();

        // change the current field number/status
        this._updateFieldNumber();

        var nextField = this.fields[this.current];
        classie.add(nextField, 'fs-current');
        classie.add(nextField, 'fs-show');
    }

    // after animation ends remove added classes from fields
    var self = this,
        onEndAnimationFn = function (ev) {
            if (support.animations) {
                this.removeEventListener(animEndEventName, onEndAnimationFn);
            }

            classie.remove(self.fieldsList, 'fs-display-' + self.navdir);
            classie.remove(currentFld, 'fs-hide');

            if (self.isLastStep) {
                // show the complete form and hide the controls
                self._hideCtrl(self.ctrlNav);
                self._hideCtrl(self.ctrlProgress);
                self._hideCtrl(self.ctrlContinue);
                self._hideCtrl(self.ctrlFldStatus);
                // replace class fs-form-full with fs-form-overview
                classie.remove(self.formEl, 'fs-form-full');
                classie.add(self.formEl, 'fs-form-overview');
                classie.add(self.formEl, 'fs-show');
                classie.add(document.getElementById("graph-btn"),"fs-hide");

            }
            else {
                classie.remove(nextField, 'fs-show');

                if (self.options.ctrlNavPosition) {
                    self.ctrlFldStatusCurr.innerHTML = self.ctrlFldStatusNew.innerHTML;
                    self.ctrlFldStatus.removeChild(self.ctrlFldStatusNew);
                    classie.remove(self.ctrlFldStatus, 'fs-show-' + self.navdir);
                }
            }
            self.isAnimating = false;
        };

    if (support.animations) {
        if (this.navdir === 'next') {
            if (this.isLastStep) {
                currentFld.querySelector('.fs-anim-upper').addEventListener(animEndEventName, onEndAnimationFn);
            }
            else {
                nextField.querySelector('.fs-anim-lower').addEventListener(animEndEventName, onEndAnimationFn);
            }
        }
        else {
            nextField.querySelector('.fs-anim-upper').addEventListener(animEndEventName, onEndAnimationFn);
        }
    }
    else {
        onEndAnimationFn();
    }
}

/**
 * showField function
 * jumps to the field at position pos
 */
FormController.prototype._showField = function (pos) {
    if (pos === this.current || pos < 0 || pos > this.fieldsCount - 1) {
        return false;
    }
    this._nextField(pos);
}

/**
 * updateFieldNumber function
 * changes the current field number
 */
FormController.prototype._updateFieldNumber = function () {
    if (this.options.ctrlNavPosition) {
        // first, create next field number placeholder
        this.ctrlFldStatusNew = document.createElement('span');
        this.ctrlFldStatusNew.className = 'fs-number-new';
        this.ctrlFldStatusNew.innerHTML = Number(this.current + 1);

        // insert it in the DOM
        this.ctrlFldStatus.appendChild(this.ctrlFldStatusNew);

        // add class "fs-show-next" or "fs-show-prev" depending on the navigation direction
        var self = this;
        setTimeout(function () {
            classie.add(self.ctrlFldStatus, self.navdir === 'next' ? 'fs-show-next' : 'fs-show-prev');
        }, 25);
    }
}

/**
 * progress function
 * updates the progress bar by setting its width
 */
FormController.prototype._progress = function () {
    if (this.options.ctrlProgress) {
        this.ctrlProgress.style.width = this.current * ( 100 / this.fieldsCount ) + '%';
    }
}

/**
 * updateNav function
 * updates the navigation dots
 */
FormController.prototype._updateNav = function () {
    if (this.options.ctrlNavDots) {
        classie.remove(this.ctrlNav.querySelector('button.fs-dot-current'), 'fs-dot-current');
        classie.add(this.ctrlNavDots[this.current], 'fs-dot-current');
        this.ctrlNavDots[this.current].disabled = false;
    }
}

/**
 * showCtrl function
 * shows a control
 */
FormController.prototype._showCtrl = function (ctrl) {
    classie.add(ctrl, 'fs-show');
}

/**
 * hideCtrl function
 * hides a control
 */
FormController.prototype._hideCtrl = function (ctrl) {
    classie.remove(ctrl, 'fs-show');
}
