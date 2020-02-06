export class Tween extends Animation {
  constructor(targets, vars, time) {
    if (typeof vars === "number") {
      time.duration = vars;
      vars = time;
      time = null;
    }
    super(_inheritDefaults(vars), time);
    let {
        duration,
        delay,
        immediateRender,
        stagger,
        overwrite,
        keyframes,
        defaults
      } = this.vars,
      parsedTargets =
        _isArray(targets) && _isNumber(targets[0])
          ? [targets]
          : toArray(targets),
      tl,
      i,
      copy,
      l,
      p,
      curTarget,
      staggerFunc,
      staggerVarsToMerge;
    this._targets = parsedTargets.length
      ? _harness(parsedTargets)
      : _warn(
          "GSAP target " + targets + " not found. https://greensock.com",
          !_config.nullTargetWarn
        ) || [];
    this._ptLookup = []; //PropTween lookup. An array containing an object for each target, having keys for each tweening property
    this._overwrite = overwrite;
    if (
      keyframes ||
      stagger ||
      _isFuncOrString(duration) ||
      _isFuncOrString(delay)
    ) {
      vars = this.vars;
      tl = this.timeline = new Timeline({
        data: "nested",
        defaults: defaults || {}
      });
      tl.kill();
      tl.parent = this;
      if (keyframes) {
        _setDefaults(tl.vars.defaults, { ease: "none" });
        keyframes.forEach(frame => tl.to(parsedTargets, frame, ">"));
      } else {
        l = parsedTargets.length;
        staggerFunc = stagger ? distribute(stagger) : _emptyFunc;
        if (_isObject(stagger)) {
          //users can pass in callbacks like onStart/onComplete in the stagger object. These should fire with each individual tween.
          for (p in stagger) {
            if (~_staggerTweenProps.indexOf(p)) {
              if (!staggerVarsToMerge) {
                staggerVarsToMerge = {};
              }
              staggerVarsToMerge[p] = stagger[p];
            }
          }
        }
        for (i = 0; i < l; i++) {
          copy = {};
          for (p in vars) {
            if (_staggerPropsToSkip.indexOf(p) < 0) {
              copy[p] = vars[p];
            }
          }
          copy.stagger = 0;
          if (staggerVarsToMerge) {
            _merge(copy, staggerVarsToMerge);
          }
          if (vars.yoyoEase && !vars.repeat) {
            //so that propagation works properly when a ancestor timeline yoyos
            copy.yoyoEase = vars.yoyoEase;
          }
          curTarget = parsedTargets[i];
          //don't just copy duration or delay because if they're a string or function, we'd end up in an infinite loop because _isFuncOrString() would evaluate as true in the child tweens, entering this loop, etc. So we parse the value straight from vars and default to 0.
          copy.duration = +_parseFuncOrString(
            duration,
            this,
            i,
            curTarget,
            parsedTargets
          );
          copy.delay =
            (+_parseFuncOrString(delay, this, i, curTarget, parsedTargets) ||
              0) - this._delay;
          if (!stagger && l === 1 && copy.delay) {
            // if someone does delay:"random(1, 5)", repeat:-1, for example, the delay shouldn't be inside the repeat.
            this._delay = delay = copy.delay;
            this._start += delay;
            copy.delay = 0;
          }
          tl.to(curTarget, copy, staggerFunc(i, curTarget, parsedTargets));
        }
        duration = delay = 0;
      }
      duration || this.duration((duration = tl.duration()));
    } else {
      this.timeline = 0; //speed optimization, faster lookups (no going up the prototype chain)
    }

    if (overwrite === true) {
      _overwritingTween = this;
      _globalTimeline.killTweensOf(parsedTargets);
      _overwritingTween = 0;
    }

    if (
      immediateRender ||
      (!duration &&
        !keyframes &&
        this._start === this.parent._time &&
        _isNotFalse(immediateRender) &&
        _hasNoPausedAncestors(this) &&
        this.parent.data !== "nested")
    ) {
      this._tTime = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
      this.render(Math.max(0, -delay)); //in case delay is negative
    }
  }

  render(totalTime, suppressEvents, force) {
    let prevTime = this._time,
      tDur = this._tDur,
      dur = this._dur,
      tTime =
        totalTime > tDur - _tinyNum && totalTime >= 0
          ? tDur
          : totalTime < _tinyNum
          ? 0
          : totalTime,
      time,
      pt,
      iteration,
      cycleDuration,
      prevIteration,
      isYoyo,
      ratio,
      timeline,
      yoyoEase;
    if (!dur) {
      _renderZeroDurationTween(this, totalTime, suppressEvents, force);
    } else if (
      tTime !== this._tTime ||
      !totalTime ||
      force ||
      (this._startAt && this._zTime < 0 !== totalTime < 0)
    ) {
      //this senses if we're crossing over the start time, in which case we must record _zTime and force the render, but we do it in this lengthy conditional way for performance reasons (usually we can skip the calculations): this._initted && (this._zTime < 0) !== (totalTime < 0)
      time = tTime;
      timeline = this.timeline;
      if (this._repeat) {
        //adjust the time for repeats and yoyos
        cycleDuration = dur + this._rDelay;
        time = _round(tTime % cycleDuration); //round to avoid floating point errors. (4 % 0.8 should be 0 but some browsers report it as 0.79999999!)
        if (time > dur) {
          time = dur;
        }
        iteration = ~~(tTime / cycleDuration);
        if (iteration && iteration === tTime / cycleDuration) {
          time = dur;
          iteration--;
        }
        isYoyo = this._yoyo && iteration & 1;
        if (isYoyo) {
          yoyoEase = this._yEase;
          time = dur - time;
        }
        prevIteration = _animationCycle(this._tTime, cycleDuration);
        if (time === prevTime && !force && this._initted) {
          //could be during the repeatDelay part. No need to render and fire callbacks.
          return this;
        }
        if (iteration !== prevIteration) {
          //timeline && this._yEase && _propagateYoyoEase(timeline, isYoyo);
          //repeatRefresh functionality
          if (this.vars.repeatRefresh && !isYoyo && !this._lock) {
            this._lock = force = 1; //force, otherwise if lazy is true, the _attemptInitTween() will return and we'll jump out and get caught bouncing on each tick.
            this.render(cycleDuration * iteration, true).invalidate()._lock = 0;
          }
        }
      }

      if (
        !this._initted &&
        _attemptInitTween(this, time, force, suppressEvents)
      ) {
        this._tTime = 0; // in constructor if immediateRender is true, we set _tTime to -_tinyNum to have the playhead cross the starting point but we can't leave _tTime as a negative number.
        return this;
      }

      this._tTime = tTime;
      this._time = time;

      if (!this._act && this._ts) {
        this._act = 1; //as long as it's not paused, force it to be active so that if the user renders independent of the parent timeline, it'll be forced to re-render on the next tick.
        this._lazy = 0;
      }

      this.ratio = ratio = (yoyoEase || this._ease)(time / dur);
      if (this._from) {
        this.ratio = ratio = 1 - ratio;
      }

      if (!prevTime && time && !suppressEvents) {
        _callback(this, "onStart");
      }

      pt = this._pt;
      while (pt) {
        pt.r(ratio, pt.d);
        pt = pt._next;
      }

      (timeline &&
        timeline.render(
          totalTime < 0
            ? totalTime
            : !time && isYoyo
            ? -_tinyNum
            : timeline._dur * ratio,
          suppressEvents,
          force
        )) ||
        (this._startAt && (this._zTime = totalTime));

      if (this._onUpdate && !suppressEvents) {
        if (totalTime < 0 && this._startAt) {
          this._startAt.render(totalTime, true, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
        }
        _callback(this, "onUpdate");
      }

      if (this._repeat)
        if (
          iteration !== prevIteration &&
          this.vars.onRepeat &&
          !suppressEvents &&
          this.parent
        ) {
          _callback(this, "onRepeat");
        }
      if ((tTime === this._tDur || !tTime) && this._tTime === tTime) {
        if (totalTime < 0 && this._startAt && !this._onUpdate) {
          this._startAt.render(totalTime, true, force);
        }
        (totalTime || !dur) &&
          ((totalTime && this._ts > 0) || (!tTime && this._ts < 0)) &&
          _removeFromParent(this, 1); // don't remove if we're rendering at exactly a time of 0, as there could be autoRevert values that should get set on the next tick (if the playhead goes backward beyond the startTime, negative totalTime). Don't remove if the timeline is reversed and the playhead isn't at 0, otherwise tl.progress(1).reverse() won't work. Only remove if the playhead is at the end and timeScale is positive, or if the playhead is at 0 and the timeScale is negative.
        if (!suppressEvents && !(totalTime < 0 && !prevTime)) {
          _callback(
            this,
            tTime === tDur ? "onComplete" : "onReverseComplete",
            true
          );
          this._prom && this._prom();
        }
      }
    }
    return this;
  }

  targets() {
    return this._targets;
  }

  invalidate() {
    this._pt = this._op = this._startAt = this._onUpdate = this._act = this._lazy = 0;
    this._ptLookup = [];
    if (this.timeline) {
      this.timeline.invalidate();
    }
    return super.invalidate();
  }

  kill(targets, vars = "all") {
    if (!targets && (!vars || vars === "all")) {
      this._lazy = 0;
      if (this.parent) {
        return _interrupt(this);
      }
    }
    if (this.timeline) {
      this.timeline.killTweensOf(
        targets,
        vars,
        _overwritingTween && _overwritingTween.vars.overwrite !== true
      );
      return this;
    }
    let parsedTargets = this._targets,
      killingTargets = targets ? toArray(targets) : parsedTargets,
      propTweenLookup = this._ptLookup,
      firstPT = this._pt,
      overwrittenProps,
      curLookup,
      curOverwriteProps,
      props,
      p,
      pt,
      i;
    if (
      (!vars || vars === "all") &&
      _arraysMatch(parsedTargets, killingTargets)
    ) {
      return _interrupt(this);
    }
    overwrittenProps = this._op = this._op || [];
    if (vars !== "all") {
      //so people can pass in a comma-delimited list of property names
      if (_isString(vars)) {
        p = {};
        _forEachName(vars, name => (p[name] = 1));
        vars = p;
      }
      vars = _addAliasesToVars(parsedTargets, vars);
    }
    i = parsedTargets.length;
    while (i--) {
      if (~killingTargets.indexOf(parsedTargets[i])) {
        curLookup = propTweenLookup[i];
        if (vars === "all") {
          overwrittenProps[i] = vars;
          props = curLookup;
          curOverwriteProps = {};
        } else {
          curOverwriteProps = overwrittenProps[i] = overwrittenProps[i] || {};
          props = vars;
        }
        for (p in props) {
          pt = curLookup && curLookup[p];
          if (pt) {
            if (!("kill" in pt.d) || pt.d.kill(p) === true) {
              _removeLinkedListItem(this, pt, "_pt");
            }
            delete curLookup[p];
          }
          if (curOverwriteProps !== "all") {
            curOverwriteProps[p] = 1;
          }
        }
      }
    }
    if (this._initted && !this._pt && firstPT) {
      //if all tweening properties are killed, kill the tween. Without this line, if there's a tween with multiple targets and then you killTweensOf() each target individually, the tween would technically still remain active and fire its onComplete even though there aren't any more properties tweening.
      _interrupt(this);
    }
    return this;
  }

  static to(targets, vars) {
    return new Tween(targets, vars, arguments[2]);
  }

  static from(targets, vars) {
    return new Tween(targets, _parseVars(arguments, 1));
  }

  static delayedCall(delay, callback, params, scope) {
    return new Tween(callback, 0, {
      immediateRender: false,
      lazy: false,
      overwrite: false,
      delay: delay,
      onComplete: callback,
      onReverseComplete: callback,
      onCompleteParams: params,
      onReverseCompleteParams: params,
      callbackScope: scope
    });
  }

  static fromTo(targets, fromVars, toVars) {
    return new Tween(targets, _parseVars(arguments, 2));
  }

  static set(targets, vars) {
    vars.duration = 0;
    if (!vars.repeatDelay) {
      vars.repeat = 0;
    }
    return new Tween(targets, vars);
  }

  static killTweensOf(targets, props, onlyActive) {
    return _globalTimeline.killTweensOf(targets, props, onlyActive);
  }
}
