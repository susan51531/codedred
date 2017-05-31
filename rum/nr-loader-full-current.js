window.NREUM || (NREUM = {});
__nr_require = // prelude.js edited from: https://github.com/substack/browser-pack/blob/master/prelude.js

  // modules are defined as an array
  // [ module function, map of requireuires ]
  //
  // map of requireuires is short require name -> numeric require

  (function (modules, cache, entry) { // eslint-disable-line no-extra-parens
    function newRequire(name) {
      if (!cache[name]) {
        var m = cache[name] = {
          exports: {}
        }
        modules[name][0].call(m.exports, function (x) {
          var id = modules[name][1][x]
          return newRequire(id || x)
        }, m, m.exports)
      }
      return cache[name].exports
    }

    // If there is already an agent on the page, use it instead.
    if (typeof __nr_require === 'function') return __nr_require

    for (var i = 0; i < entry.length; i++) newRequire(entry[i])

    return newRequire
  })
  ({
    1: [function (require, module, exports) {
      var ee = require("ee")
      var mapOwn = require(15)
      var flags = {}
      var flagArr

      try {
        flagArr = localStorage.getItem('__nr_flags').split(',')
        if (console && typeof console.log === 'function') {
          flags.console = true
          if (flagArr.indexOf('dev') !== -1) flags.dev = true
          if (flagArr.indexOf('nr_dev') !== -1) flags.nrDev = true
        }
      } catch (err) {
        // no op
      }

      if (flags.nrDev) ee.on('internal-error', function (err) {
        log(err.stack)
      })
      if (flags.dev) ee.on('fn-err', function (args, origThis, err) {
        log(err.stack)
      })
      if (flags.dev) {
        log('NR AGENT IN DEVELOPMENT MODE')
        log('flags: ' + mapOwn(flags, function (key, val) {
          return key
        }).join(', '))
      }

      function log(message) {
        try {
          if (flags.console) console.log(message)
        } catch (err) {
          // no op
        }
      }

    }, {}],
    2: [function (require, module, exports) {
      var handle = require("handle")
      var slice = require(16)
      var ee = require("ee")
      var loader = require("loader")
      var origOnerror = window.onerror
      var handleErrors = false

      // skipNext counter to keep track of uncaught
      // errors that will be the same as caught errors.
      var skipNext = 0

      // Declare that we are using err instrumentation
      loader.features.err = true
      require(1)

      window.onerror = onerrorHandler

      try {
        throw new Error()
      } catch (e) {
        // Only wrap stuff if try/catch gives us useful data. It doesn't in IE < 10.
        if ('stack' in e) {
          require(8)
          require(7)

          if ('addEventListener' in window) {
            require(5)
          }

          if (loader.xhrWrappable) {
            require(9)
          }

          handleErrors = true
        }
      }

      ee.on('fn-start', function (args, obj, methodName) {
        if (handleErrors) skipNext += 1
      })

      ee.on('fn-err', function (args, obj, err) {
        if (handleErrors) {
          this.thrown = true
          notice(err)
        }
      })

      ee.on('fn-end', function () {
        if (handleErrors)
          if (!this.thrown && skipNext > 0) skipNext -= 1
      })

      ee.on('internal-error', function (e) {
        handle('ierr', [e, loader.now(), true])
      })

      // FF and Android browsers do not provide error info to the 'error' event callback, so we must use window.onerror
      function onerrorHandler(message, filename, lineno, column, errorObj) {
        try {
          if (skipNext) skipNext -= 1
          else handle('err', [(errorObj || new UncaughtException(message, filename, lineno))])
        } catch (e) {
          try {
            handle('ierr', [e, loader.now(), true])
          } catch (err) {}
        }

        if (typeof origOnerror === 'function') return origOnerror.apply(this, slice(arguments))
        return false
      }

      function UncaughtException(message, filename, lineno) {
        this.message = message || 'Uncaught error with no additional information'
        this.sourceURL = filename
        this.line = lineno
      }

      function notice(err) {
        handle('err', [err, loader.now()])
      }

    }, {}],
    3: [function (require, module, exports) {
      // Turn on feature
      require("loader").features.ins = true

    }, {}],
    4: [function (require, module, exports) {
      if (!(window.performance &&
          window.performance.timing &&
          window.performance.getEntriesByType
        )) return

      var ee = require("ee")
      var handle = require("handle")
      var timerEE = require(8)
      var rafEE = require(7)

      var learResourceTimings = 'learResourceTimings'
      var ADD_EVENT_LISTENER = 'addEventListener'
      var RESOURCE_TIMING_BUFFER_FULL = 'resourcetimingbufferfull'
      var BST_RESOURCE = 'bstResource'
      var RESOURCE = 'resource'
      var START = '-start'
      var END = '-end'
      var FN_START = 'fn' + START
      var FN_END = 'fn' + END
      var BST_TIMER = 'bstTimer'
      var PUSH_STATE = 'pushState'

      // Turn on feature harvesting
      var loader = require("loader")
      loader.features.stn = true

      // wrap history ap
      require(6)

      // Cache the value of window.Event for later instanceof checks, in case someone
      // overwrites it to be a non-function.
      var origEvent = NREUM.o.EV

      ee.on(FN_START, function (args, target) {
        var evt = args[0]
        if (evt instanceof origEvent) {
          this.bstStart = loader.now()
        }
      })

      ee.on(FN_END, function (args, target) {
        var evt = args[0]
        if (evt instanceof origEvent) {
          handle('bst', [evt, target, this.bstStart, loader.now()])
        }
      })

      timerEE.on(FN_START, function (args, obj, type) {
        this.bstStart = loader.now()
        this.bstType = type
      })

      timerEE.on(FN_END, function (args, target) {
        handle(BST_TIMER, [target, this.bstStart, loader.now(), this.bstType])
      })

      rafEE.on(FN_START, function () {
        this.bstStart = loader.now()
      })

      rafEE.on(FN_END, function (args, target) {
        handle(BST_TIMER, [target, this.bstStart, loader.now(), 'requestAnimationFrame'])
      })

      ee.on(PUSH_STATE + START, function (args) {
        this.time = loader.now()
        this.startPath = location.pathname + location.hash
      })
      ee.on(PUSH_STATE + END, function (args) {
        handle('bstHist', [location.pathname + location.hash, this.startPath, this.time])
      })

      if (ADD_EVENT_LISTENER in window.performance) {
        if (window.performance['c' + learResourceTimings]) {
          window.performance[ADD_EVENT_LISTENER](RESOURCE_TIMING_BUFFER_FULL, function (e) {
            handle(BST_RESOURCE, [window.performance.getEntriesByType(RESOURCE)])
            window.performance['c' + learResourceTimings]()
          }, false)
        } else {
          window.performance[ADD_EVENT_LISTENER]('webkit' + RESOURCE_TIMING_BUFFER_FULL, function (e) {
            handle(BST_RESOURCE, [window.performance.getEntriesByType(RESOURCE)])
            window.performance['webkitC' + learResourceTimings]()
          }, false)
        }
      }

      document[ADD_EVENT_LISTENER]('scroll', noOp, {
        passive: true
      })
      document[ADD_EVENT_LISTENER]('keypress', noOp, false)
      document[ADD_EVENT_LISTENER]('click', noOp, false)

      function noOp(e) { /* no-op */ }

    }, {}],
    5: [function (require, module, exports) {
      var ee = require("ee").get('events')
      var wrapFn = require(18)(ee, true)
      var getOrSet = require("gos")

      var XHR = XMLHttpRequest
      var ADD_EVENT_LISTENER = 'addEventListener'
      var REMOVE_EVENT_LISTENER = 'removeEventListener'

      module.exports = ee

      // Guard against instrumenting environments w/o necessary features
      if ('getPrototypeOf' in Object) {
        findAndWrapNode(document)
        findAndWrapNode(window)
        findAndWrapNode(XHR.prototype)
      } else if (XHR.prototype.hasOwnProperty(ADD_EVENT_LISTENER)) {
        wrapNode(window)
        wrapNode(XHR.prototype)
      }

      ee.on(ADD_EVENT_LISTENER + '-start', function (args, target) {
        var originalListener = args[1]

        var wrapped = getOrSet(originalListener, 'nr@wrapped', function () {
          var listener = {
            object: wrapHandleEvent,
            'function': originalListener
          }[typeof originalListener]

          return listener ? wrapFn(listener, 'fn-', null, (listener.name || 'anonymous')) : originalListener

          function wrapHandleEvent() {
            if (typeof originalListener.handleEvent !== 'function') return
            return originalListener.handleEvent.apply(originalListener, arguments)
          }
        })

        this.wrapped = args[1] = wrapped
      })

      ee.on(REMOVE_EVENT_LISTENER + '-start', function (args) {
        args[1] = this.wrapped || args[1]
      })

      function findAndWrapNode(object) {
        var step = object
        while (step && !step.hasOwnProperty(ADD_EVENT_LISTENER)) {
          step = Object.getPrototypeOf(step)
        }
        if (step) {
          wrapNode(step)
        }
      }

      function wrapNode(node) {
        wrapFn.inPlace(node, [ADD_EVENT_LISTENER, REMOVE_EVENT_LISTENER], '-', uniqueListener)
      }

      function uniqueListener(args, obj) {
        // Context for the listener is stored on itself.
        return args[1]
      }

    }, {}],
    6: [function (require, module, exports) {
      // History pushState wrapper
      var ee = require("ee").get('history')
      var wrapFn = require(18)(ee)

      module.exports = ee

      wrapFn.inPlace(window.history, ['pushState', 'replaceState'], '-')

    }, {}],
    7: [function (require, module, exports) {
      // Request Animation Frame wrapper
      var ee = require("ee").get('raf')
      var wrapFn = require(18)(ee)

      var equestAnimationFrame = 'equestAnimationFrame'

      module.exports = ee

      wrapFn.inPlace(window, [
        'r' + equestAnimationFrame,
        'mozR' + equestAnimationFrame,
        'webkitR' + equestAnimationFrame,
        'msR' + equestAnimationFrame
      ], 'raf-')

      ee.on('raf-start', function (args) {
        // Wrap the callback handed to requestAnimationFrame
        args[0] = wrapFn(args[0], 'fn-')
      })

    }, {}],
    8: [function (require, module, exports) {
      var ee = require("ee").get('timer')
      var wrapFn = require(18)(ee)

      var SET_TIMEOUT = 'setTimeout'
      var SET_INTERVAL = 'setInterval'
      var CLEAR_TIMEOUT = 'clearTimeout'
      var START = '-start'
      var DASH = '-'

      module.exports = ee

      wrapFn.inPlace(window, [SET_TIMEOUT, 'setImmediate'], SET_TIMEOUT + DASH)
      wrapFn.inPlace(window, [SET_INTERVAL], SET_INTERVAL + DASH)
      wrapFn.inPlace(window, [CLEAR_TIMEOUT, 'clearImmediate'], CLEAR_TIMEOUT + DASH)

      ee.on(SET_INTERVAL + START, interval)
      ee.on(SET_TIMEOUT + START, timer)

      function interval(args, obj, type) {
        args[0] = wrapFn(args[0], 'fn-', null, type)
      }

      function timer(args, obj, type) {
        this.method = type
        this.timerDuration = (typeof args[1] === 'number') ? args[1] : 0
        args[0] = wrapFn(args[0], 'fn-', this, type)
      }

    }, {}],
    9: [function (require, module, exports) {
      // wrap-events patches XMLHttpRequest.prototype.addEventListener for us.
      require(5)

      var baseEE = require("ee")
      var ee = baseEE.get('xhr')
      var wrapFn = require(18)(ee)
      var originals = NREUM.o
      var OrigXHR = originals.XHR
      var MutationObserver = originals.MO

      var READY_STATE_CHANGE = 'readystatechange'

      var handlers = ['onload', 'onerror', 'onabort', 'onloadstart', 'onloadend', 'onprogress', 'ontimeout']
      var pendingXhrs = []

      module.exports = ee

      var XHR = window.XMLHttpRequest = function (opts) {
        var xhr = new OrigXHR(opts)
        try {
          ee.emit('new-xhr', [xhr], xhr)
          xhr.addEventListener(READY_STATE_CHANGE, wrapXHR, false)
        } catch (e) {
          try {
            ee.emit('internal-error', [e])
          } catch (err) {}
        }
        return xhr
      }

      copy(OrigXHR, XHR)

      XHR.prototype = OrigXHR.prototype

      wrapFn.inPlace(XHR.prototype, ['open', 'send'], '-xhr-', getObject)

      ee.on('send-xhr-start', function (args, xhr) {
        wrapOnreadystatechange(args, xhr)
        enqueuePendingXhr(xhr)
      })
      ee.on('open-xhr-start', wrapOnreadystatechange)

      function wrapOnreadystatechange(args, xhr) {
        wrapFn.inPlace(xhr, ['onreadystatechange'], 'fn-', getObject)
      }

      function wrapXHR() {
        var xhr = this
        var ctx = ee.context(xhr)

        if (xhr.readyState > 3 && !ctx.resolved) {
          ctx.resolved = true
          ee.emit('xhr-resolved', [], xhr)
        }

        wrapFn.inPlace(xhr, handlers, 'fn-', getObject)
      }

      // Wrapping the onreadystatechange property of XHRs takes some special tricks.
      //
      // The issue is that the onreadystatechange property may be assigned *after*
      // send() is called against an XHR. This is of particular importance because
      // jQuery uses a single onreadystatechange handler to implement all of the XHR
      // callbacks thtat it provides, and it assigns that property after calling send.
      //
      // There are several 'obvious' approaches to wrapping the onreadystatechange
      // when it's assigned after send:
      //
      // 1. Try to wrap the onreadystatechange handler from a readystatechange
      //    addEventListener callback (the addEventListener callback will fire before
      //    the onreadystatechange callback).
      //
      //      Caveat: this doesn't work in Chrome or Safari, and in fact will cause
      //      the onreadystatechange handler to not be invoked at all during the
      //      firing cycle in which it is wrapped, which may break applications :(
      //
      // 2. Use Object.defineProperty to create a setter for the onreadystatechange
      //    property, and wrap from that setter.
      //
      //      Caveat: onreadystatechange is not a configurable property in Safari or
      //      older versions of the Android browser.
      //
      // 3. Schedule wrapping of the onreadystatechange property using a setTimeout
      //    call issued just before the call to send.
      //
      //      Caveat: sometimes, the onreadystatechange handler fires before the
      //      setTimeout, meaning the wrapping happens too late.
      //
      // The setTimeout approach is closest to what we use here: we want to schedule
      // the wrapping of the onreadystatechange property when send is called, but
      // ensure that our wrapping happens before onreadystatechange has a chance to
      // fire.
      //
      // We achieve this using a hypbrid approach:
      //
      // * In browsers that support MutationObserver, we use that to schedule wrapping
      //   of onreadystatechange.
      //
      // * In older browsers that don't support MutationObserver, we rely on the fact
      //   that the call to send is probably happening within a callback that we've
      //   already wrapped, and use our existing fn-end event callback to wrap the
      //   onreadystatechange at the end of the current callback.
      //

      if (MutationObserver) {
        var toggle = 1
        var dummyNode = document.createTextNode(toggle)
        new MutationObserver(drainPendingXhrs).observe(dummyNode, {
          characterData: true
        })
      } else {
        baseEE.on('fn-end', function (args) {
          // We don't want to try to wrap onreadystatechange from within a
          // readystatechange callback.
          if (args[0] && args[0].type === READY_STATE_CHANGE) return
          drainPendingXhrs()
        })
      }

      function enqueuePendingXhr(xhr) {
        pendingXhrs.push(xhr)
        if (MutationObserver) {
          toggle = -toggle
          dummyNode.data = toggle
        }
      }

      function drainPendingXhrs() {
        for (var i = 0; i < pendingXhrs.length; i++) {
          wrapOnreadystatechange([], pendingXhrs[i])
        }
        if (pendingXhrs.length) pendingXhrs = []
      }

      // Use the object these methods are on as their
      // context store for the event emitter
      function getObject(args, obj) {
        return obj
      }

      function copy(from, to) {
        for (var i in from) {
          to[i] = from[i]
        }
        return to
      }

    }, {}],
    10: [function (require, module, exports) {
      var loader = require("loader")

      // Don't instrument Chrome for iOS, it is buggy and acts like there are URL verification issues
      if (!loader.xhrWrappable) return

      var handle = require("handle")
      var parseUrl = require(11)
      var ee = require("ee")
      var handlers = ['load', 'error', 'abort', 'timeout']
      var handlersLen = handlers.length
      var id = require("id")
      var ffVersion = require(14)
      var dataSize = require(13)

      var origXHR = window.XMLHttpRequest

      // Declare that we are using xhr instrumentation
      loader.features.xhr = true

      require(9)

      // Setup the context for each new xhr object
      ee.on('new-xhr', function (xhr) {
        var ctx = this
        ctx.totalCbs = 0
        ctx.called = 0
        ctx.cbTime = 0
        ctx.end = end
        ctx.ended = false
        ctx.xhrGuids = {}
        ctx.lastSize = null

        // In Firefox 34+, XHR ProgressEvents report pre-content-decoding sizes via
        // their 'loaded' property, rather than post-decoding sizes. We want
        // post-decoding sizes for consistency with browsers where that's all we have.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1227674
        //
        // In really old versions of Firefox (older than somewhere between 5 and 10),
        // we don't reliably get a final XHR ProgressEvent which reflects the full
        // size of the transferred resource.
        //
        // So, in both of these cases, we fall back to not using ProgressEvents to
        // measure XHR sizes.

        if (ffVersion && (ffVersion > 34 || ffVersion < 10)) return

        // In Opera, ProgressEvents report loaded values that are too high.
        if (window.opera) return

        xhr.addEventListener('progress', function (event) {
          ctx.lastSize = event.loaded
        }, false)
      })

      ee.on('open-xhr-start', function (args) {
        this.params = {
          method: args[0]
        }
        addUrl(this, args[1])
        this.metrics = {}
      })

      ee.on('open-xhr-end', function (args, xhr) {
        if ('loader_config' in NREUM && 'xpid' in NREUM.loader_config && this.sameOrigin) {
          xhr.setRequestHeader('X-NewRelic-ID', NREUM.loader_config.xpid)
        }
      })

      ee.on('send-xhr-start', function (args, xhr) {
        var metrics = this.metrics
        var data = args[0]
        var context = this

        if (metrics && data) {
          var size = dataSize(data)
          if (size) metrics.txSize = size
        }

        this.startTime = loader.now()

        this.listener = function (evt) {
          try {
            if (evt.type === 'abort') {
              context.params.aborted = true
            }
            if (evt.type !== 'load' || (context.called === context.totalCbs) && (context.onloadCalled || typeof (xhr.onload) !== 'function')) context.end(xhr)
          } catch (e) {
            try {
              ee.emit('internal-error', [e])
            } catch (err) {}
          }
        }

        for (var i = 0; i < handlersLen; i++) {
          xhr.addEventListener(handlers[i], this.listener, false)
        }
      })

      ee.on('xhr-cb-time', function (time, onload, xhr) {
        this.cbTime += time
        if (onload) this.onloadCalled = true
        else this.called += 1
        if ((this.called === this.totalCbs) && (this.onloadCalled || typeof (xhr.onload) !== 'function')) this.end(xhr)
      })

      ee.on('xhr-load-added', function (cb, useCapture) {
        // Ignore if the same arguments are passed to addEventListener twice
        var idString = '' + id(cb) + !!useCapture
        if (!this.xhrGuids || this.xhrGuids[idString]) return
        this.xhrGuids[idString] = true

        this.totalCbs += 1
      })

      ee.on('xhr-load-removed', function (cb, useCapture) {
        // Ignore if event listener didn't exist for this xhr object
        var idString = '' + id(cb) + !!useCapture
        if (!this.xhrGuids || !this.xhrGuids[idString]) return
        delete this.xhrGuids[idString]

        this.totalCbs -= 1
      })

      // Listen for load listeners to be added to xhr objects
      ee.on('addEventListener-end', function (args, xhr) {
        if (xhr instanceof origXHR && args[0] === 'load') ee.emit('xhr-load-added', [args[1], args[2]], xhr)
      })

      ee.on('removeEventListener-end', function (args, xhr) {
        if (xhr instanceof origXHR && args[0] === 'load') ee.emit('xhr-load-removed', [args[1], args[2]], xhr)
      })

      // Listen for those load listeners to be called.
      ee.on('fn-start', function (args, xhr, methodName) {
        if (xhr instanceof origXHR) {
          if (methodName === 'onload') this.onload = true
          if ((args[0] && args[0].type) === 'load' || this.onload) this.xhrCbStart = loader.now()
        }
      })

      ee.on('fn-end', function (args, xhr) {
        if (this.xhrCbStart) ee.emit('xhr-cb-time', [loader.now() - this.xhrCbStart, this.onload, xhr], xhr)
      })

      // Create report for XHR request that has finished
      function end(xhr) {
        var params = this.params
        var metrics = this.metrics

        if (this.ended) return
        this.ended = true

        for (var i = 0; i < handlersLen; i++) {
          xhr.removeEventListener(handlers[i], this.listener, false)
        }

        if (params.aborted) return
        metrics.duration = loader.now() - this.startTime
        if (xhr.readyState === 4) {
          params.status = xhr.status

          var size = responseSizeFromXhr(xhr, this.lastSize)

          if (size) metrics.rxSize = size

          if (this.sameOrigin) {
            var header = xhr.getResponseHeader('X-NewRelic-App-Data')
            if (header) {
              params.cat = header.split(', ').pop()
            }
          }
        } else {
          params.status = 0
        }

        // Always send cbTime, even if no noticeable time was taken.
        metrics.cbTime = this.cbTime
        ee.emit('xhr-done', [xhr], xhr)
        handle('xhr', [params, metrics, this.startTime])
      }

      function responseSizeFromXhr(xhr, lastSize) {
        var type = xhr.responseType
        if (type === 'json' && lastSize !== null) return lastSize
        // Caution! Chrome throws an error if you try to access xhr.responseText for binary data
        var data = (type === 'arraybuffer' || type === 'blob' || type === 'json') ? xhr.response : xhr.responseText
        return dataSize(data)
      }

      function addUrl(ctx, url) {
        var parsed = parseUrl(url)
        var params = ctx.params

        params.host = parsed.hostname + ':' + parsed.port
        params.pathname = parsed.pathname
        ctx.sameOrigin = parsed.sameOrigin
      }

    }, {}],
    11: [function (require, module, exports) {
      module.exports = function parseUrl(url) {
        var urlEl = document.createElement('a')
        var location = window.location
        var ret = {}

        // Use an anchor dom element to resolve the url natively.
        urlEl.href = url

        ret.port = urlEl.port

        var firstSplit = urlEl.href.split('://')

        if (!ret.port && firstSplit[1]) {
          ret.port = firstSplit[1].split('/')[0].split('@').pop().split(':')[1]
        }
        if (!ret.port || ret.port === '0') ret.port = (firstSplit[0] === 'https' ? '443' : '80')

        // Host not provided in IE for relative urls
        ret.hostname = (urlEl.hostname || location.hostname)

        ret.pathname = urlEl.pathname

        ret.protocol = firstSplit[0]

        // Pathname sometimes doesn't have leading slash (IE 8 and 9)
        if (ret.pathname.charAt(0) !== '/') ret.pathname = '/' + ret.pathname

        // urlEl.protocol is ':' in old ie when protocol is not specified
        var sameProtocol = !urlEl.protocol || urlEl.protocol === ':' || urlEl.protocol === location.protocol
        var sameDomain = urlEl.hostname === document.domain && urlEl.port === location.port

        // urlEl.hostname is not provided by IE for relative urls, but relative urls are also same-origin
        ret.sameOrigin = sameProtocol && (!urlEl.hostname || sameDomain)

        return ret
      }

    }, {}],
    12: [function (require, module, exports) {
      var handle = require("handle")
      var mapOwn = require(15)
      var slice = require(16)
      var tracerEE = require("ee").get('tracer')
      var loader = require("loader")

      var nr = NREUM
      if (typeof (window.newrelic) === 'undefined') newrelic = nr

      var asyncApiFns = [
        'setPageViewName',
        'setCustomAttribute',
        'setErrorHandler',
        'finished',
        'addToTrace',
        'inlineHit',
        'addRelease'
      ]

      var prefix = 'api-'
      var spaPrefix = prefix + 'ixn-'

      // Setup stub functions that queue calls for later processing.
      mapOwn(asyncApiFns, function (num, fnName) {
        nr[fnName] = apiCall(prefix + fnName, true, 'api')
      })

      nr.addPageAction = apiCall(prefix + 'addPageAction', true)
      nr.setCurrentRouteName = apiCall(prefix + 'routeName', true)

      module.exports = newrelic

      nr.interaction = function () {
        return new InteractionHandle().get()
      }

      function InteractionHandle() {}

      var InteractionApiProto = InteractionHandle.prototype = {
        createTracer: function (name, cb) {
          var contextStore = {}
          var ixn = this
          var hasCb = typeof cb === 'function'
          handle(spaPrefix + 'tracer', [loader.now(), name, contextStore], ixn)
          return function () {
            tracerEE.emit((hasCb ? '' : 'no-') + 'fn-start', [loader.now(), ixn, hasCb], contextStore)
            if (hasCb) {
              try {
                return cb.apply(this, arguments)
              } finally {
                tracerEE.emit('fn-end', [loader.now()], contextStore)
              }
            }
          }
        }
      }

      mapOwn('setName,setAttribute,save,ignore,onEnd,getContext,end,get'.split(','), function addApi(n, name) {
        InteractionApiProto[name] = apiCall(spaPrefix + name)
      })

      function apiCall(name, notSpa, bufferGroup) {
        return function () {
          handle(name, [loader.now()].concat(slice(arguments)), notSpa ? null : this, bufferGroup)
          return notSpa ? void 0 : this
        }
      }

      newrelic.noticeError = function (err) {
        if (typeof err === 'string') err = new Error(err)
        handle('err', [err, loader.now()])
      }

    }, {}],
    13: [function (require, module, exports) {
      module.exports = function dataSize(data) {
        if (typeof data === 'string' && data.length) return data.length
        if (typeof data !== 'object') return undefined
        if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer && data.byteLength) return data.byteLength
        if (typeof Blob !== 'undefined' && data instanceof Blob && data.size) return data.size
        if (typeof FormData !== 'undefined' && data instanceof FormData) return undefined

        try {
          return JSON.stringify(data).length
        } catch (e) {
          return undefined
        }
      }

    }, {}],
    14: [function (require, module, exports) {
      var ffVersion = 0
      var match = navigator.userAgent.match(/Firefox[\/\s](\d+\.\d+)/)
      if (match) ffVersion = +match[1]

      module.exports = ffVersion

    }, {}],
    15: [function (require, module, exports) {
      var has = Object.prototype.hasOwnProperty

      module.exports = mapOwn

      function mapOwn(obj, fn) {
        var results = []
        var key = ''
        var i = 0

        for (key in obj) {
          if (has.call(obj, key)) {
            results[i] = fn(key, obj[key])
            i += 1
          }
        }

        return results
      }

    }, {}],
    16: [function (require, module, exports) {
      /**
       * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
       * Build: `lodash modularize modern exports="npm" -o ./npm/`
       * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
       * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
       * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
       * Available under MIT license <http://lodash.com/license>
       */

      /**
       * Slices the `collection` from the `start` index up to, but not including,
       * the `end` index.
       *
       * Note: This function is used instead of `Array#slice` to support node lists
       * in IE < 9 and to ensure dense arrays are returned.
       *
       * @private
       * @param {Array|Object|string} collection The collection to slice.
       * @param {number} start The start index.
       * @param {number} end The end index.
       * @returns {Array} Returns the new array.
       */
      function slice(array, start, end) {
        start || (start = 0);
        if (typeof end == 'undefined') {
          end = array ? array.length : 0;
        }
        var index = -1,
          length = end - start || 0,
          result = Array(length < 0 ? 0 : length);

        while (++index < length) {
          result[index] = array[start + index];
        }
        return result;
      }

      module.exports = slice;

    }, {}],
    17: [function (require, module, exports) {
      module.exports = {
        exists: typeof (window.performance) !== 'undefined' && window.performance.timing && typeof (window.performance.timing.navigationStart) !== 'undefined'
      }

    }, {}],
    18: [function (require, module, exports) {
      var ee = require("ee")
      var slice = require(16)
      var flag = 'nr@original'
      var has = Object.prototype.hasOwnProperty
      var inWrapper = false

      module.exports = function (emitter, always) {
        emitter || (emitter = ee)

        wrapFn.inPlace = inPlace
        wrapFn.flag = flag

        return wrapFn

        function wrapFn(fn, prefix, getContext, methodName) {
          // Unless fn is both wrappable and unwrapped, return it unchanged.
          if (notWrappable(fn)) return fn

          if (!prefix) prefix = ''

          nrWrapper[flag] = fn
          copy(fn, nrWrapper)
          return nrWrapper

          function nrWrapper() {
            var args
            var originalThis
            var ctx
            var result

            try {
              originalThis = this
              args = slice(arguments)

              if (typeof getContext === 'function') {
                ctx = getContext(args, originalThis)
              } else {
                ctx = getContext || {}
              }
            } catch (e) {
              report([e, '', [args, originalThis, methodName], ctx])
            }

            // Warning: start events may mutate args!
            safeEmit(prefix + 'start', [args, originalThis, methodName], ctx)

            try {
              result = fn.apply(originalThis, args)
              return result
            } catch (err) {
              safeEmit(prefix + 'err', [args, originalThis, err], ctx)

              // rethrow error so we don't effect execution by observing.
              throw err
            } finally {
              // happens no matter what.
              safeEmit(prefix + 'end', [args, originalThis, result], ctx)
            }
          }
        }

        function inPlace(obj, methods, prefix, getContext) {
          if (!prefix) prefix = ''
          // If prefix starts with '-' set this boolean to add the method name to
          // the prefix before passing each one to wrap.
          var prependMethodPrefix = (prefix.charAt(0) === '-')
          var fn
          var method
          var i

          for (i = 0; i < methods.length; i++) {
            method = methods[i]
            fn = obj[method]

            // Unless fn is both wrappable and unwrapped bail,
            // so we don't add extra properties with undefined values.
            if (notWrappable(fn)) continue

            obj[method] = wrapFn(fn, (prependMethodPrefix ? method + prefix : prefix), getContext, method)
          }
        }

        function safeEmit(evt, arr, store) {
          if (inWrapper && !always) return
          var prev = inWrapper
          inWrapper = true
          try {
            emitter.emit(evt, arr, store, always)
          } catch (e) {
            report([e, evt, arr, store])
          }
          inWrapper = prev
        }

        function copy(from, to) {
          if (Object.defineProperty && Object.keys) {
            // Create accessors that proxy to actual function
            try {
              var keys = Object.keys(from)
              keys.forEach(function (key) {
                Object.defineProperty(to, key, {
                  get: function () {
                    return from[key]
                  },
                  set: function (val) {
                    from[key] = val;
                    return val
                  }
                })
              })
              return to
            } catch (e) {
              report([e])
            }
          }
          // fall back to copying properties
          for (var i in from) {
            if (has.call(from, i)) {
              to[i] = from[i]
            }
          }
          return to
        }

        function report(args) {
          try {
            emitter.emit('internal-error', args)
          } catch (err) {}
        }
      }

      function notWrappable(fn) {
        return !(fn && fn instanceof Function && fn.apply && !fn[flag])
      }

    }, {}],
    "ee": [function (require, module, exports) {
      var ctxId = 'nr@context'
      var getOrSet = require("gos")
      var mapOwn = require(15)

      var eventBuffer = {}
      var emitters = {}

      var baseEE = module.exports = ee()

      baseEE.backlog = eventBuffer

      function EventContext() {}

      function ee(old) {
        var handlers = {}
        var bufferGroupMap = {}

        var emitter = {
          on: on,
          emit: emit,
          get: getOrCreate,
          listeners: listeners,
          context: context,
          buffer: bufferEventsByGroup,
          abort: abortIfNotLoaded,
          aborted: false
        }

        return emitter

        function context(contextOrStore) {
          if (contextOrStore && contextOrStore instanceof EventContext) {
            return contextOrStore
          } else if (contextOrStore) {
            return getOrSet(contextOrStore, ctxId, getNewContext)
          } else {
            return getNewContext()
          }
        }

        function emit(type, args, contextOrStore, force) {
          if (baseEE.aborted && !force) {
            return
          }
          if (old) old(type, args, contextOrStore)

          var ctx = context(contextOrStore)
          var handlersArray = listeners(type)
          var len = handlersArray.length

          // Extremely verbose debug logging
          // if ([/^xhr/].map(function (match) {return type.match(match)}).filter(Boolean).length) {
          //  console.log(type + ' args:')
          //  console.log(args)
          //  console.log(type + ' handlers array:')
          //  console.log(handlersArray)
          //  console.log(type + ' context:')
          //  console.log(ctx)
          //  console.log(type + ' ctxStore:')
          //  console.log(ctxStore)
          // }

          // Apply each handler function in the order they were added
          // to the context with the arguments

          for (var i = 0; i < len; i++) handlersArray[i].apply(ctx, args)

          // Buffer after emitting for consistent ordering
          var bufferGroup = eventBuffer[bufferGroupMap[type]]
          if (bufferGroup) {
            bufferGroup.push([emitter, type, args, ctx])
          }

          // Return the context so that the module that emitted can see what was done.
          return ctx
        }

        function on(type, fn) {
          // Retrieve type from handlers, if it doesn't exist assign the default and retrieve it.
          handlers[type] = listeners(type).concat(fn)
        }

        function listeners(type) {
          return handlers[type] || []
        }

        function getOrCreate(name) {
          return (emitters[name] = emitters[name] || ee(emit))
        }

        function bufferEventsByGroup(types, group) {
          mapOwn(types, function (i, type) {
            group = group || 'feature'
            bufferGroupMap[type] = group
            if (!(group in eventBuffer)) {
              eventBuffer[group] = []
            }
          })
        }
      }

      function getNewContext() {
        return new EventContext()
      }

      // abort should be called 30 seconds after the page has started running
      // We should drop our data and stop collecting if we still have a backlog, which
      // signifies the rest of the agent wasn't loaded
      function abortIfNotLoaded() {
        if (eventBuffer.api || eventBuffer.feature) {
          baseEE.aborted = true
          eventBuffer = baseEE.backlog = {}
        }
      }

    }, {}],
    "gos": [function (require, module, exports) {
      var has = Object.prototype.hasOwnProperty

      module.exports = getOrSet

      // Always returns the current value of obj[prop], even if it has to set it first
      function getOrSet(obj, prop, getVal) {
        // If the value exists return it.
        if (has.call(obj, prop)) return obj[prop]

        var val = getVal()

        // Attempt to set the property so it's not enumerable
        if (Object.defineProperty && Object.keys) {
          try {
            Object.defineProperty(obj, prop, {
              value: val, // old IE inherits non-write-ability
              writable: true,
              enumerable: false
            })

            return val
          } catch (e) {
            // Can't report internal errors,
            // because GOS is a dependency of the reporting mechanisms
          }
        }

        // fall back to setting normally
        obj[prop] = val
        return val
      }

    }, {}],
    "handle": [function (require, module, exports) {
      var ee = require("ee").get('handle')

      // Exported for register-handler to attach to.
      module.exports = handle
      handle.ee = ee

      function handle(type, args, ctx, group) {
        ee.buffer([type], group)
        ee.emit(type, args, ctx)
      }

    }, {}],
    "id": [function (require, module, exports) {
      // Start assigning ids at 1 so 0 can always be used for window, without
      // actually setting it (which would create a global variable).
      var index = 1
      var prop = 'nr@id'
      var getOrSet = require("gos")

      module.exports = id

      // Always returns id of obj, may tag obj with an id in the process.
      function id(obj) {
        var type = typeof obj
        // We can only tag objects, functions, and arrays with ids.
        // For all primitive values we instead return -1.
        if (!obj || !(type === 'object' || type === 'function')) return -1
        if (obj === window) return 0

        return getOrSet(obj, prop, function () {
          return index++
        })
      }

    }, {}],
    "loader": [function (require, module, exports) {
      var lastTimestamp = new Date().getTime()
      var handle = require("handle")
      var mapOwn = require(15)
      var ee = require("ee")

      var win = window
      var doc = win.document

      var ADD_EVENT_LISTENER = 'addEventListener'
      var ATTACH_EVENT = 'attachEvent'
      var XHR = win.XMLHttpRequest
      var XHR_PROTO = XHR && XHR.prototype

      NREUM.o = {
        ST: setTimeout,
        CT: clearTimeout,
        XHR: XHR,
        REQ: win.Request,
        EV: win.Event,
        PR: win.Promise,
        MO: win.MutationObserver
      }

      var origin = '' + location
      var defInfo = {
        beacon: 'bam.nr-data.net',
        errorBeacon: 'bam.nr-data.net',
        agent: 'js-agent.newrelic.com/nr-1026.js'
      }

      var xhrWrappable = XHR &&
        XHR_PROTO &&
        XHR_PROTO[ADD_EVENT_LISTENER] &&
        !/CriOS/.test(navigator.userAgent)

      var exp = module.exports = {
        offset: lastTimestamp,
        now: now,
        origin: origin,
        features: {},
        xhrWrappable: xhrWrappable
      }

      // api loads registers several event listeners, but does not have any exports
      require(12)

      if (doc[ADD_EVENT_LISTENER]) {
        doc[ADD_EVENT_LISTENER]('DOMContentLoaded', loaded, false)
        win[ADD_EVENT_LISTENER]('load', windowLoaded, false)
      } else {
        doc[ATTACH_EVENT]('onreadystatechange', stateChange)
        win[ATTACH_EVENT]('onload', windowLoaded)
      }

      handle('mark', ['firstbyte', lastTimestamp], null, 'api')

      var loadFired = 0

      function windowLoaded() {
        if (loadFired++) return
        var info = exp.info = NREUM.info
        var firstScript = doc.getElementsByTagName('script')[0]
        setTimeout(ee.abort, 30000)

        if (!(info && info.licenseKey && info.applicationID && firstScript)) return ee.abort()

        mapOwn(defInfo, function (key, val) {
          // this will overwrite any falsy value in config
          // This is intentional because agents may write an empty string to
          // the agent key in the config, in which case we want to use the default
          if (!info[key]) info[key] = val
        })

        handle('mark', ['onload', now() + exp.offset], null, 'api')
        var agent = doc.createElement('script')
        agent.src = 'https://' + info.agent
        firstScript.parentNode.insertBefore(agent, firstScript)
      }

      function stateChange() {
        if (doc.readyState === 'complete') loaded()
      }

      function loaded() {
        handle('mark', ['domContent', now() + exp.offset], null, 'api')
      }

      var performanceCheck = require(17)

      function now() {
        if (performanceCheck.exists && performance.now) {
          return Math.round(performance.now())
        }
        // ensure a new timestamp is never smaller than a previous timestamp
        return (lastTimestamp = Math.max(new Date().getTime(), lastTimestamp)) - exp.offset
      }

    }, {}]
  }, {}, ["loader", 2, 10, 4, 3])