// Copyright (c) 2012 The Wall Street Journal, 
// http://wsj.com/

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

define('Context', function () {

    'use strict';

    var Context = function(params){

        if(params){
          for(var param in params){
            if(params.hasOwnProperty(param)){
              this[param] = params[param];  
            }
          }
        }
        
        this.thresholds = this._setThresholds();

        this._bindEvents();

        this._context = this._getContext();

        this._listeners = {};

        this._setInfo();

        return this;

      };

      Context.prototype = {
        // props
        thresholdNames:[],
        interactionModes:['touch', 'mouse'],

        // code and concept taken from simple implementation of observer pattern outlined here:
        // http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/
        on: function(type, listener){
          if(typeof this._listeners[type] === 'undefined') {
            this._listeners[type]=[];
          }
          this._listeners[type].push(listener)
        },

        off: function(type, listener){
          if(this._listeners[type] instanceof Array){
            var listeners = this._listeners[type];
            for(var i=0;listeners.length; i++){
              if(listeners[i] === listener){
                listeners.splice(i,1);
                break;
              }
            }
          }
        },

        _fire: function(event){
          if(typeof event === 'string') {
            event={type:event};
          }

          if(!event.target){
            event.target=this;
          }

          if(!event.type){
            throw new Error(event.type + ' is not a supported event.');
          }

          if(this._listeners[event.type] instanceof Array){
            var listeners = this._listeners[event.type];
            for(var i=0; i<listeners.length; i++){
              listeners[i].call(this, event);
            }
          }

        },

        _thresholdIndex: function(threshold){

          for(var i=0; i<this.thresholds.length; i++){
            if(threshold > thresholds[i]){
              return i;
            }

            if(i+1 === this.thresholds.length){
              return i+1;
            }

          }
        },

        add: function(threshold){

          // can either be a number OR {name:'mobile',width:400}
          this.thresholds;

          if( typeof threshold === 'number') {

            var index = this._thresholdIndex(threshold);

            this.thresholds.splice(index ,0, threshold);
          } else {
            var index = this._thresholdIndex(threshold.width);

            this.thresholds.splice(index ,0, threshold.width);

            this.thresholdNames.splice(index ,0, threshold.name);
          }

          
        },

        _setThresholds: function(){

          this.thresholdNames=[];

          if(typeof this.thresholds === 'undefined'){
            this.thresholds = {
              mobile:400,
              tablet:768,
              standard:980
            }
          }
          
          if(this.thresholds.length){

            var thresholds = thresholds.sort(function(a,b){return a-b;});

          } else {

            var thresholdsBuffer=[];

            for(var threshold in this.thresholds){
              if(this.thresholds.hasOwnProperty(threshold)){
                thresholdsBuffer.push(this.thresholds[threshold]);
                this.thresholdNames.push(threshold);
              }
            }

            thresholds = thresholdsBuffer;
          }

          return thresholds;
        }, 

        _bindEvents: function(){

          if(document.addEventListener){
            

            if("onorientationchange" in window){
              window.addEventListener("orientationchange", 
                this.contextualize, false);
            }

            window.addEventListener('resize', 
              this._throttle(this._hitch(this, this.contextualize), 100), false);

            
          // IE
          } else if ( document.attachEvent ) {

            if("onorientationchange" in window){
              window.attachEvent("onorientationchange", 
                this.contextualize);
            }

            window.attachEvent('onresize', 
              this._throttle(this._hitch(this, this.contextualize), 100));

          }

        },

        contextualize: function(trigger){

          
          if(typeof window.innerHeight === 'number') {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
          } else if(document.documentElement && document.documentElement.clientWidth){
            this.width = document.documentElement.clientWidth;
            this.height = document.documentElement.clientHeight;
          }
          
          if(this._hasChanged()){

            // update the info about the new context
            var e = this._getInfo();

            for(var param in e){
              if(e.hasOwnProperty(param)){
                this[param]=e[param];
              }
            }
            
            // after the info is updated, changeContext, fire the change event
            e.type = 'change';

            // trigger is the event object from whatever engaged the change in context
            // that could be a window resize or a orientation change at this point
            e.trigger = trigger;

            this._fire(e);
          }
        },

        _hasChanged: function(){

          var context = this._getContext();

          if(context !== this._context){
            this._context=context;

            this._setInfo();

            return true;
          }

          return false;
        },

        _getInfo:function(){

          return this._info;

        },

        _setInfo: function(){
          var pixelRatio = 1,
            interaction='mouse',
            name;

          if(window.devicePixelRatio !== undefined){
            pixelRatio = window.devicePixelRatio;
          }

          if("ontouchstart" in window) {
            interaction='touch'
          }

          if(this.thresholdNames.length){
            name=this.thresholdNames[this._context];
          } else {
            name=this._context;
          }

          this._info = {
            pixelRatio:pixelRatio,
            interaction: interaction,
            name: name,
            threshold:this.thresholds[this._context]
          };

          return;
        },

        _getContext: function(){
          
          for(var i=0; i<this.thresholds.length; i++){



            if(this.width <= this.thresholds[i]){
              return i;
              break;
            }
          }
          return this.thresholds.length - 1;
        },

        _throttle : function(callback, interval){
            var lastExec = new Date();
            var timer = null;
            return function(e){
              var d = new Date();
              if (d-lastExec < interval) {
                if (timer) {
                   window.clearTimeout(timer);
                }
                
                var callbackWrapper = function(event){
                  return function(){
                    callback(event);
                  };
                };
                
                timer = window.setTimeout(callbackWrapper(e), interval);
                return false;
              }
              callback(e);
              lastExec = d;
            };
        },

        _isTouchDevice: function() {
          return "ontouchstart" in window;
        },

        _hitch: function(scope,fn){
          return function(){
            return fn.apply(scope, arguments); 
          };
        },

        value: function(name){
          return this[name];
        },

        info:function(){
          return this._getInfo();
        }

      };

    

      


  return new Context;

});