(function (root, factory, undef) {
    'use strict';

    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('underscore'), require('Backbone'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore', 'backbone'], function (_, Backbone) {
            // Check if we use the AMD branch of Back
            _ = _ === undef ? root._ : _;
            Backbone = Backbone === undef ? root.Backbone : Backbone;
            return (root.returnExportsGlobal = factory(_, Backbone, root));
        });
    } else {
        // Browser globals
        root.returnExportsGlobal = factory(root._, root.Backbone);
    }

// Usage:
//
// Note: This plugin is UMD compatible, you can use it in node, amd and vanilla js envs
//
// Vanilla JS:
// <script src="underscore.js"></script>
// <script src="backbone.js"></script>
// <script src="backbone.model.plus.js"></script>
//
// Node:
// var _ = require('underscore');
// var Backbone = require('backbone');
// var ModelPlus = require('backbone.model.plus');
//
//
// AMD:
// define(['underscore', 'backbone', 'backbone.model.plus'], function (_, Backbone, Mutators) {
//    // insert sample from below
//    return User;
// });
//
// var User = Backbone.Model.extend({
//    mutators: {
//        fullname: function () {
//            return this.firstname + ' ' + this.lastname;
//        }
//    },
//
//    defaults: {
//        firstname: 'Chris',
//        lastname: 'Luebcke'
//    }
// });
//
// var user = new User();
// user.get('fullname') // returns 'Chris Luebcke'
// user.toJSON() // return '{firstname: 'Chris', lastname: 'Luebcke', fullname: 'Chris Luebcke'}'

}(this, function (_, Backbone, root, undef) {
    'use strict';

    // check if we use the amd branch of backbone and underscore
    Backbone = Backbone === undef ? root.Backbone : Backbone;
    _ = _ === undef ? root._ : _;

    // extend backbones model prototype with the mutator functionality
    var ModelPlus   = function () {},
        oldGet      = Backbone.Model.prototype.get,
        oldSet      = Backbone.Model.prototype.set,
        oldToJson   = Backbone.Model.prototype.toJSON;

    // This is necessary to ensure that Models declared without the mutators object do not throw and error
    ModelPlus.prototype.mutators = {};

    // override get functionality to fetch the mutator props
    ModelPlus.prototype.get = function (attr) {
        var isMutator = this.mutators !== undef;
        var path;

        function getNestedValue(object, path) {
            if (path.length > 1 && typeof object[path[0]] !== "undefined") {
                getNestedValue(object[path], path.slice(1));
            } else {
                return object[path[0]];
            }
        }

        // check if we have a getter mutation
        if (isMutator === true && _.isFunction(this.mutators[attr]) === true) {
            return this.mutators[attr].call(this);
        }

        // check if we have a deeper nested getter mutation
        if (isMutator === true && _.isObject(this.mutators[attr]) === true && _.isFunction(this.mutators[attr].get) === true) {
            return this.mutators[attr].get.call(this);
        }

        if (attr.indexOf(".") > 0) {
            path = attr.split(".");
            return getNestedValue(oldGet.call(this, path[0]), path.slice(1));
        }

        return oldGet.call(this, attr);
    };

    // override set functionality to set the mutator props
    ModelPlus.prototype.set = function (key, value, options) {
        var isMutator = this.mutators !== undef,
            ret = oldSet.call(this, key, value, options),
            attrs;

        function setNestedValue(object, path, value) {
            if (path.length > 1) {
                if (!hasOwnProperty(object, path[0])) {
                    object[path[0]] = {};
                }
                setNestedValue(object[path], path.slice(1), value);
            } else {
                object[path[0]] = value;
            }
        }

        if (typeof key === "string" && key.indexOf(".") >= 0) {
            var path = key.split(".");
            if (this.get(path[0]) === undefined) {
                this.set(path[0], {});
            }
            setNestedValue(this.get(path[0]), path.slice(1), value);
        }

        // seamlessly stolen from backbone core
        // check if the setter action is triggered
        // using key <-> value or object
        if (_.isObject(key) || key === null) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }

        // check if we have a deeper nested setter mutation
        if (isMutator && _.isObject(this.mutators[key])) {

            // check if we need to set a single value
            if (_.isFunction(this.mutators[key].set) === true) {
                ret = this.mutators[key].set.call(this, key, attrs[key], options, _.bind(oldSet, this));
            } else if(_.isFunction(this.mutators[key])){
                ret = this.mutators[key].call(this, key, attrs[key], options, _.bind(oldSet, this));
            }
        }

        if (isMutator === true && _.isObject(attrs)) {
            _.each(attrs, _.bind(function (attr, attrKey) {
                if (_.isObject(this.mutators[attrKey]) === true) {
                    // check if we need to set a single value

                    var meth = this.mutators[attrKey];
                    if(_.isFunction(meth.set)){
                        meth = meth.set;
                    }

                    if(_.isFunction(meth)){
                        if (options === undef || (_.isObject(options) === true && options.silent !== true && (options.mutators !== undef && options.mutators.silent !== true))) {
                            this.trigger('mutators:set:' + attrKey);
                        }
                        meth.call(this, attrKey, attr, options, _.bind(oldSet, this));
                    }

                }
            }, this));
        }

        return ret;
    };

    // override toJSON functionality to serialize mutator properties
    ModelPlus.prototype.toJSON = function (options) {
        // fetch ye olde values
        var attr = oldToJson.call(this),
            isSaving,
            isTransient;
        // iterate over all mutators (if there are some)
        _.each(this.mutators, _.bind(function (mutator, name) {
            // check if we have some getter mutations
            if (_.isObject(this.mutators[name]) === true && _.isFunction(this.mutators[name].get)) {
                isSaving = _.has(options || {}, 'emulateHTTP');
                isTransient = this.mutators[name].transient;
                if (!isSaving || !isTransient) {
                  attr[name] = _.bind(this.mutators[name].get, this)();
                }
            } else {
                attr[name] = _.bind(this.mutators[name], this)();
            }
        }, this));

        return attr;
    };

    // override get functionality to get HTML-escaped the mutator props
    ModelPlus.prototype.escape = function (attr){
        var val = this.get(attr);
        return _.escape(val == null ? '' : '' + val);
    };

    // extend the models prototype
    _.extend(Backbone.Model.prototype, ModelPlus.prototype);

    // make mutators globally available under the Backbone namespace
    Backbone.ModelPlus = ModelPlus;
    return ModelPlus;
}));
