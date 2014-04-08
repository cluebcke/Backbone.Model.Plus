(function (root, factory, undef) {
    'use strict';

    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('underscore'), require('backbone'));
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
            if (typeof object !== "object") {
                return;
            }
            if (path.length > 1 && typeof object[path[0]] !== "undefined") {
                return getNestedValue(object[path[0]], path.slice(1));
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

        if (typeof attr === "string" && attr.indexOf(".") > 0) {
            path = attr.split(".");
            return getNestedValue(oldGet.call(this, path[0]), path.slice(1));
        }

        return oldGet.call(this, attr);
    };

    // Because Backbone.Model's set() operation does a number of different things,
    // like running validation and emitting events, in addition to actually setting
    // values in the model, there isn't really a clean way to use it while also
    // supporting mutators, nested properties, etc. So, this a mixture of
    // copy/paste and rewrite from Backbone (as well as Backbone.Mutators, of
    // course.
    ModelPlus.prototype.set = function (key, value, options) {
        var attribute, attributes, unset, changes, silent, changing, previousAttributes,
            hasMutators, path, newValue, currentValue, setter, valueSet, i;

        function setNestedValue(object, path, value) {
            if (path.length > 1) {
                if (!object.hasOwnProperty(path[0])) {
                    object[path[0]] = {};
                }
                setNestedValue(object[path[0]], path.slice(1), value);
            } else {
                if (unset) {
                    delete object[path[0]];
                } else {
                    object[path[0]] = value;
                }
            }
        }

        hasMutators = !!this.mutators;

        if (!key) {
            return this;
        }

        if (typeof key === "object") {
            attributes = key;
            options = value;
        } else {
            attributes = {};
            attributes[key] = value;
        }

        options = options || (options = {});

        // Run validation
        if (!this._validate(attributes, options)) {
            return false;
        }

        // Extract attributes and options
        unset = options.unset;
        silent = options.silent;
        changes = [];
        changing = this._changing;
        this._changing = true;

        // Check for changes of `id`.
        if (this.idAttribute in attributes) {
            this.id = attributes[this.idAttribute];
        }

        if (!changing) {
            // We need to pull previous values via the get() function, so that
            // computed and nested values are included
            this._previousAttributes = {};
            for (attribute in this.attributes) {
                this._previousAttributes[attribute] = this.get(attribute);
            }
            this.changed = {};
        }
        previousAttributes = this._previousAttributes;

        for (attribute in attributes) {
            valueSet = false;
            newValue = attributes[attribute];
            currentValue = this.get(attribute);

            // Queue up only the values that have actually changed
            if (!_.isEqual(this.get(attribute), newValue)) {
                changes.push(attribute);
            }

            // Queue up a list of attributes to trigger change events for
            // (but remove any previously set attributes that have now been
            // set back to their previous value)
            if (_.isEqual(previousAttributes[attribute], newValue)) {
                delete this.changed[attribute];
            } else {
                this.changed[attribute] = newValue;
            }

            // Apply to mutator if there is one
            if (hasMutators && this.mutators[attribute]) {
                if (_.isFunction(this.mutators[attribute].set)) {
                    setter = this.mutators[attribute].set;
                } else if (_.isFunction(this.mutators[attribute])) {
                    setter = this.mutators[attribute];
                } else {
                    setter = null;
                }
                if (setter) {
                    setter.call(this, attribute, newValue, options, _.bind(oldSet, this));
                    valueSet = true;
                    if (!silent) {
                        this.trigger("mutators:set:" + attribute);
                    }
                }
            }

            // Apply as a nested property if it wasn't a mutator
            if (!valueSet && attribute.indexOf(".") > 0) {
                path = attribute.split(".");
                if (this.get(path[0]) === undefined) {
                    this.set(path[0], {});
                }
                setNestedValue(this.get(path[0]), path.slice(1), newValue);
                valueSet = true;
            }

            // Apply as a regular property if none of the above were true
            if (!valueSet) {
                if (unset) {
                    delete this.attributes[attribute];
                } else {
                    this.attributes[attribute] = newValue;
                }
            }
        }

        // Trigger all relevant attribute changes.
        if (!silent) {
            if (changes.length > 0) {
                this._pending = true;
            }
            for (i = 0; i < changes.length; i++) {
                this.trigger("change:" + changes[i], this, this.get(changes[i]), options);
            }
        }

        if (!changing) {
            if (!silent) {
                while (this._pending) {
                    this._pending = false;
                    this.trigger("change", this, options);
                }
            }
            this._pending = false;
            this._changing = false;
        }

        return this;
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
                } else if(attr[name]) {
                    delete(attr[name]);
                }
            } else if (_.isFunction(this.mutators[name])) {
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
