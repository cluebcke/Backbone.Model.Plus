module('Backbone.Model.Plus');

test("can get 'normal' value", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            fullname: function () {
                return this.firstname + ' ' + this.lastname;
            }
        }
    });

    var model = new Model();
    model.set('firstname', 'Sebastian');
    model.set('lastname', 'Golasch');

    equal(model.get('firstname'), 'Sebastian', 'Can get unmutated firstname');
    equal(model.get('lastname'), 'Golasch', 'Can get unmutated lastname');
});

test("can get 'mutated' value (newly created)", function () {
    expect(3);
    var Model = Backbone.Model.extend({
        mutators: {
            fullname: function () {
                return this.get('firstname') + ' ' + this.get('lastname');
            }
        }
    });

    var model = new Model();
    model.set('firstname', 'Sebastian');
    model.set('lastname', 'Golasch');
    equal(model.get('firstname'), 'Sebastian', 'Can get unmutated firstname');
    equal(model.get('lastname'), 'Golasch', 'Can get unmutated lastname');
    equal(model.get('fullname'), 'Sebastian Golasch', 'Can get mutated fullname');
});

test("can get 'mutated' value (overridden)", function () {
    expect(5);
    var Model = Backbone.Model.extend({
        mutators: {
            status: function (key, value, options, set) {
                if(key){
                    set('status', value);
                }

                return { status: this.attributes.status, overallStatus: this.get('overallStatus'), underestimatedNonOverallStatus: this.get('underestimatedNonOverallStatus') };
            }
        }
    });

    var model = new Model();
    model.set('overallStatus', 1);
    model.set('underestimatedNonOverallStatus', 3);
    model.set('status', 2);

    equal(model.get('overallStatus'), 1, 'Can get unmutated overallStatus');
    equal(model.get('underestimatedNonOverallStatus'), 3, 'Can get unmutated underestimatedNonOverallStatus');
    equal(model.get('status').status, 2, 'Can get mutated status');
    equal(model.get('status').overallStatus, 1, 'Can get mutated status');
    equal(model.get('status').underestimatedNonOverallStatus, 3, 'Can get mutated status');
});

test("can get 'normal' value - object context", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            fullanme: {
                get: function () {
                    return this.get('firstname') + ' ' + this.get('lastname');
                }
            }
        }
    });

    var model = new Model();
    model.set('firstname', 'Sebastian');
    model.set('lastname', 'Golasch');

    equal(model.get('firstname'), 'Sebastian', 'Can get unmutated firstname');
    equal(model.get('lastname'), 'Golasch', 'Can get unmutated lastname');
});

test("can get 'mutated' value (newly created) - object context", function () {
    expect(3);
    var Model = Backbone.Model.extend({
        mutators: {
            fullname: {
                get: function () {
                    return this.get('firstname') + ' ' + this.get('lastname');
                }
            }
        }
    });

    var model = new Model();
    model.set('firstname', 'Sebastian');
    model.set('lastname', 'Golasch');

    equal(model.get('firstname'), 'Sebastian', 'Can get unmutated firstname');
    equal(model.get('lastname'), 'Golasch', 'Can get unmutated lastname');
    equal(model.get('fullname'), 'Sebastian Golasch', 'Can get mutated fullname');
});

test("can get 'mutated' value (overridden) - object context", function () {
    expect(5);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                get: function () {
                    return { status: this.attributes.status, overallStatus: this.get('overallStatus'), underestimatedNonOverallStatus: this.get('underestimatedNonOverallStatus') };
                }
            }
        }
    });

    var model = new Model();
    model.set('overallStatus', 1);
    model.set('underestimatedNonOverallStatus', 3);
    model.set('status', 2);

    equal(model.get('overallStatus'), 1, 'Can get unmutated overallStatus');
    equal(model.get('underestimatedNonOverallStatus'), 3, 'Can get unmutated underestimatedNonOverallStatus');
    equal(model.get('status').status, 2, 'Can get mutated status');
    equal(model.get('status').overallStatus, 1, 'Can get mutated status');
    equal(model.get('status').underestimatedNonOverallStatus, 3, 'Can get mutated status');
});

test("can set 'normal' value (key <-> value)", function () {
    expect(1);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function () {
                    return { status: this.attributes.status, overallStatus: this.get('overallStatus'), underestimatedNonOverallStatus: this.get('underestimatedNonOverallStatus') };
                }
            }
        }
    });

    var model = new Model();
    model.set('overallStatus', 1);

    equal(model.get('overallStatus'), 1, 'Can get unmutated overallStatus');
});

test("can set 'mutated' value (key <-> value)", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options) {
                    this.set('pState', value.pState, options);
                    this.set('aState', value.aState, options);
                }
            }
        }
    });

    var model = new Model();
    model.set('status', {pState: 1, aState: 2});

    equal(model.get('pState'), 1, 'Can get mutated pState');
    equal(model.get('aState'), 2, 'Can get mutated aState');
});

test("can set 'normal' value (object)", function () {
    expect(1);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function () {
                    return {
                        status: this.attributes.status,
                        overallStatus: this.get('overallStatus'),
                        underestimatedNonOverallStatus: this.get('underestimatedNonOverallStatus')
                    };
                }
            }
        }
    });

    var model = new Model();
    model.set({overallStatus: 1});

    equal(model.get('overallStatus'), 1, 'Can get unmutated overallStatus');
});

test("can set attribute objects", function () {
    expect(3);
    var Model = Backbone.Model.extend({
        mutators: {
            fullname: {
                set: function (key, value, options) {
                    var names = value.split(' ');
                    this.set('firstname', names[0], options);
                    this.set('lastname', names[1], options);
                }
            }
        }
    });

    var model = new Model();
    model.set({ fullname: 'Sebastian Golasch', admin: true });

    equal(model.get('firstname'), 'Sebastian', 'Can get the firstname');
    equal(model.get('lastname'), 'Golasch', 'Can get the lastname');
    equal(model.get('admin'), true, 'Can get the admin status');
});

test("can set newly created 'mutated' value (object)", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options) {
                    this.set('pState', value.pState, options);
                    this.set('aState', value.aState, options);
                }
            }
        }
    });

    var model = new Model();
    model.set({status: {pState: 1, aState: 2, dState: 3}});

    equal(model.get('pState'), 1, 'Can get mutated pState');
    equal(model.get('aState'), 2, 'Can get mutated aState');
});

test("can set 'mutated' value (object)", function () {
    expect(4);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options, set) {
                    if(_.isString(value)){
                        set(key, value);
                    } else {
                        this.set('pState', value.pState, options);
                        this.set('aState', value.aState, options);
                        if (value.pState === 1) {
                            set(key, 'supercool', options);
                        }
                    }
                }
            }
        },
        defaults: {
            status: 'awkward'
        }
    });

    var model = new Model();

    equal(model.get('status'), 'awkward', 'Can get unmodified value');
    model.set({status: {pState: 1, aState: 2, dState: 3}});
    equal(model.get('status'), 'supercool', 'Can get mutated status value');
    equal(model.get('pState'), 1, 'Can get mutated pState');
    equal(model.get('aState'), 2, 'Can get mutated aState');

});

test("can set 'mutated' value and fire event", function () {
    expect(3);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options, set) {
                    set(key, value.toLowerCase(), options);
                }
            }
        },
        defaults: {
            status: 'awkward'
        }
    });

    var model = new Model();

    model.bind('mutators:set:status', function () {
        ok(true, 'Callback called');
    });

    equal(model.get('status'), 'awkward', 'Can get unmodified value');
    model.set({status: 'SUPERCOOL'});
    equal(model.get('status'), 'supercool', 'Can get mutated status value');

});

test("can set 'mutated' value and fire event", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options, set) {
                    set(key, value.toLowerCase(), options);
                }
            }
        },
        defaults: {
            status: 'awkward'
        }
    });

    var model = new Model();

    model.bind('mutators:set:status', function () {
        ok(false, 'Callback called (And this shouldn´t happen)');
    });

    equal(model.get('status'), 'awkward', 'Can get unmodified value');
    model.set('status', 'SUPERCOOL', {silent: true});
    equal(model.get('status'), 'supercool', 'Can get mutated status value');

});

test("can set 'mutated' value and fire event", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options, set) {
                    set(key, value.toLowerCase(), options);
                }
            }
        },
        defaults: {
            status: 'awkward'
        }
    });

    var model = new Model();

    model.bind('mutators:set:status', function () {
        ok(false, 'Callback called (And this shouldn´t happen)');
    });

    model.bind('change:status', function () {
        ok(false, 'Callback called (And this should not happen)');
    });

    equal(model.get('status'), 'awkward', 'Can get unmodified value');
    model.set('status', 'SUPERCOOL', {silent: true});
    equal(model.get('status'), 'supercool', 'Can get mutated status value');

});

test("can serialize an unmutated model", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        defaults: {
            a: 'a',
            b: 'b'
        }
    });

    equal((new Model()).toJSON().a, 'a', 'can serialize unmutated model');
    equal((new Model()).toJSON().b, 'b', 'can serialize unmutated model');
});

test("can serialize mutated model", function () {
    expect(3);
    var Model = Backbone.Model.extend({
        defaults: {
            a: 'a',
            b: 'b'
        },
        mutators: {
            state: function () {
                return this.get('a') + ', ' + this.get('b');
            }
        }
    });

    equal((new Model()).toJSON().a, 'a', 'can serialize mutated model');
    equal((new Model()).get('state'), 'a, b', 'can serialize mutated model');
    equal((new Model()).toJSON().state, 'a, b', 'can serialize mutated model');
});

test("can escape mutated properties", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        defaults: {
            a: 'a',
            b: 'b'
        },
        mutators: {
            b: function () {
                return 'c';
            }
        }
    });

    var model = new Model();
    equal(model.get('b'), 'c');
    model.set('b', 'foobar');
    equal(model.get('b'), 'c');
});

test("can get/set using single method", 5, function(){

    var Model = Backbone.Model.extend({
        mutators:{
            state:function(key, value){
                if(key){
                    this.set("a", value);

                    equal(arguments.length, 4);
                    return null; //prevents ret from returning
                }

                return this.get("a");
            }
        }
    });

    var model = new Model();

    var value = "happy";
    model.set('state', value);

    equal(model.get('state'), value);

    var new_state = "excited";
    var new_level = 10;

    //set multiple
    model.set({
        level:new_level,
        state:new_state
    });

    equal(model.get('state'), new_state);
    equal(model.get('level'), new_level);

});

test("can omit transient variables from JSON when saving", 4, function() {
  var Model = Backbone.Model.extend({
    defaults:{
      firstName:"Iain",
      middleInit:"M",
      lastName:"Banks"
    },
    mutators:{
      fullName:{
        get: function() {
          var fullName = this.get("firstName");
          fullName += " " + this.get("middleInit");
          fullName += ". " + this.get("lastName");
          return fullName;
        },
        transient: true
      }
    }
  });
  
  var model = new Model();
  // First make sure we didn't break the accessor (or the normal model property
  // access)
  equal(model.get("fullName"), "Iain M. Banks");
  equal(model.get("firstName"), "Iain");
  
  // Ensure that a normal toJSON call (like you'd use with a template) includes
  // the computed value
  var modelToJSON = model.toJSON();
  equal(modelToJSON.fullName, "Iain M. Banks");
  
  // Backbone always sets 'emulateHTTP' to true or (usually) false when syncing, 
  // so we use the existence of that property as a proxy for "yes I'm syncing"
  var modelToJSONSync = model.toJSON({emulateHTTP:false});
  equal(typeof modelToJSONSync.fullName, "undefined");
});

test("can retrieve nested values from model", function () {
    expect(3);
    var Model = Backbone.Model.extend({
        defaults: {
            name: {
                first: "Iain",
                middleInit: "M",
                last: "Banks"
            }
        }
    });

    var model = new Model();
    equal(model.get("name.first"), "Iain");
    equal(model.get("name.middleInit"), "M");
    equal(model.get("name.last"), "Banks");
});

test("returns undefined when attempting to retrieve a nested property whose parent does not exist", function() {
    expect(1);
    var Model = Backbone.Model.extend({});
    var model = new Model();
    equal(typeof model.get("this.does.not.exist"), "undefined");
});

test("can set a new nested value on model", function() {
    expect(1);
    var Model = Backbone.Model.extend({

    });
    var model = new Model();

    model.set("name.first", "Iain");

    equal(model.get("name.first"), "Iain");
});

test("can update an existing nested value on model", function() {
    expect(1);
    var Model = Backbone.Model.extend({
        defaults: {
            name: {
                first: "Fred",
                last: "Flintstone"
            }
        }
    });
    var model = new Model();

    model.set("name.first", "Iain");

    equal(model.get("name.first"), "Iain");
});

test("setting a nested property emits the expected events", function() {
    expect(1);
    var Model = Backbone.Model.extend({

    });
    var model = new Model();
    model.on("change:name.first", function() {
        ok(true);
    });

    model.set("name.first", "Iain");
});

test("Can unset a nested property", function() {
    expect(2);
    var Model = Backbone.Model.extend({
        defaults: {
            please: {
                delete: "me"
            }
        }
    });
    var model = new Model();
    model.unset("please.delete");
    equal(typeof model.get("please.delete"), "undefined");
    model.unset("please");
    equal(typeof model.get("please"), "undefined");
});

test("Change event for a field set by a mutator should be emitted after setters are executed", function() {
    expect(1);
    var Model = Backbone.Model.extend({
        defaults: {
            firstName: "Hot",
            lastName: "Dog"
        },
        mutators: {
            fullName: {
                get: function() {
                    return this.get("firstName") + " " + this.get("lastName");
                },
                set: function(key, value, options, set) {
                    var name = value.split(" ");
                    this.set("firstName", name[0]);
                    this.set("lastname", name[1]);
                }
            }
        }
    });
    var model = new Model();
    model.on("change:firstName", function(model, value, options) {
        equal(model.get("firstName"), "Wiley");
    });
    model.set("fullName", "Wiley Coyote");
});

test("Change event for the mutator should be emitted after setters are executed", function() {
    expect(1);
    var Model = Backbone.Model.extend({
        defaults: {
            firstName: "Bob",
            lastName: "Cat"
        },
        mutators: {
            fullName: {
                get: function() {
                    return this.get("firstName") + " " + this.get("lastName");
                },
                set: function(key, value, options, set) {
                    var name = value.split(" ");
                    this.set("firstName", name[0]);
                    this.set("lastname", name[1]);
                }
            }
        }
    });
    var model = new Model();
    model.on("change:fullName", function(model, value, options) {
       equal(model.get("firstName"), "Johnny");
    });
    model.set("fullName", "Johnny Dog");
});

test("Mutators can have dotted names", function() {
    expect(2);
    var Model = Backbone.Model.extend({
        defaults: {
            dont: {
                set: {
                    me: "bro"
                }
            }
        },
        mutators: {
            "dont.set.me": function() {
                return "dude"
            }
        }
    });
    var model = new Model();
    model.set("dont.set.me", "sis");
    equal(model.get("dont.set.me"), "dude");
    equal(model.attributes.dont.set.me, "bro");
});

test("Setting a nested property will create intermediary objects when needed", function() {
    expect(1);
    var Model = Backbone.Model.extend({
    });
    var model = new Model();
    model.set("here.is.a.deeply.nested", "string");
    equal(model.get("here.is.a.deeply.nested"), "string");
});

test("Can serialize mutated model with only a setter", function () {
    expect(2);
    var Model = Backbone.Model.extend({
        mutators: {
            status: {
                set: function (key, value, options, set) {
                    set(key, value.toLowerCase(), options);
                }
            }
        },
        defaults: {
            status: 'awkward'
        }
    });

    var model = new Model();

    equal(model.toJSON().status, 'awkward', 'can serialize mutated model');
    model.set('status', 'SUPERCOOL', {mutators: {silent: true}});
    equal(model.toJSON().status, 'supercool', 'can serialize mutated model');
});

test("Can set mutated, nested and 'normal' values in the same call to save", function() {
    expect(3);
    var Model = Backbone.Model.extend({
        mutators: {
            mutato: {
                get: function() {
                    return this.get("potato");
                },
                set: function(key, value, options, set) {
                    this.set("potato", value);
                }
            }
        },
        defaults: {
            nested: {
                values: {
                    are: "just okay"
                }
            },
            normal: "values are awesome"
        }
    });
    var model = new Model();
    model.set({
        "mutato": "french fries",
        "nested.values.are": "awesome",
        "normal": "values are boring"
    });
    equal(model.get("mutato"), "french fries");
    equal(model.get("nested.values.are"), "awesome");
    equal(model.get("normal"), "values are boring");
});
