var reactMixin = require('..');
var expect = require('expect.js');
var sinon = require('sinon');
var React = require('react');
var objectAssign = require('object-assign');

describe('react-mixin', function(){
    describe('mixins prototype', function () {
        var proto, instance;

        beforeEach(function(){
            function Component(){
            };
            Component.prototype = Object.create(React.Component);
            Component.prototype.constructor = Component;
            Component.prototype.render = function(){ return 1; };
            Component.prototype.handleClick = function(){ return 2; };
            proto = Component.prototype;
            instance = Object.create(Component.prototype);
        });

        it("doesn't always throw", function(){
            expect(function(){ reactMixin(proto, {}); }).to.not.throwException();
        });

        it("merges lifecycle methods", function(){
            var s1 = sinon.spy(), s2 = sinon.spy();
            proto.componentWillMount = s1;
            reactMixin(proto, {componentWillMount: s2});
            instance.componentWillMount();
            expect(s1.called).to.be.ok();
            expect(s2.called).to.be.ok();
        });

        it("throws when handleClick is defined in both", function(){
            expect(function(){
                reactMixin(proto, {handleClick: function(){}});
            }).to.throwException(/handleClick/);
        });
    });

    describe('mixins whole class', function () {
        var reactClass;

        beforeEach(function () {
            function Component(){
            };
            Component.prototype = Object.create(React.Component);
            Component.prototype.constructor = Component;
            Component.prototype.render = function(){ return 1; };
            Component.prototype.handleClick = function(){ return 2; };
            Component.prototype.setState = sinon.spy(function(nextState) {
                this.state = objectAssign(this.state || {}, nextState);
            });
            reactClass = Component;
        });

        it('mixins proto and static props separately', function () {
            var mixin = {
                contextTypes: {},
                getChildContext: function() {}
            };

            reactMixin.onClass(reactClass, mixin);

            expect(reactClass.contextTypes).to.exist;
            expect(reactClass.prototype.getChildContext).to.exist;

            expect(reactClass.getChildContext).not.to.exist;
            expect(reactClass.prototype.contextTypes).not.to.exist;
        });

        it('calls getDefaultProps and sets result as static prop', function () {
            var mixin = {
                getDefaultProps: function() {
                    return {
                        test: 'test'
                    }
                }
            };

            reactMixin.onClass(reactClass, mixin);

            expect(reactClass.defaultProps).to.eql({test: 'test'});
            expect(reactClass.prototype.getDefaultProps).not.to.exist;
        });

        it('acts as decorator', function() {
            var mixin = {
                getDefaultProps: function() {
                    return {
                        test: 'test'
                    }
                }
            };

            var decorator = reactMixin.decorate(mixin);
            var instance = decorator(reactClass);

            expect(reactClass.defaultProps).to.eql({test: 'test'});
            expect(reactClass.prototype.getDefaultProps).not.to.exist;
        });

        describe('wrap getInitialState into componentWillMount', function () {
            it('creates new componentWillMount if there is no such', function () {
                var mixin = {
                    getInitialState: function() {
                        return {
                            test: 'test'
                        }
                    }
                };

                reactMixin.onClass(reactClass, mixin);
                expect(reactClass.prototype.componentWillMount).to.exist;

                Object.create(reactClass.prototype).componentWillMount();

                expect(reactClass.prototype.setState.calledOnce).to.be.true;
                expect(reactClass.prototype.getInitialState).not.to.exist;
            });

            it('merges two componentWillMount', function () {
                var mixin = {
                    getInitialState: function() {
                        return {
                            test: 'test'
                        }
                    },
                    componentWillMount: function() {
                        this.setState({test1: 'test1'})
                    }
                };

                reactMixin.onClass(reactClass, mixin);
                expect(reactClass.prototype.componentWillMount).to.exist;

                Object.create(reactClass.prototype).componentWillMount();

                expect(reactClass.prototype.setState.calledTwice).to.be.true
                expect(reactClass.prototype.getInitialState).not.to.exist;
            });

            it('calls getInitialState before original componentWillMount which have access to state', function() {
                var mixin = {
                    getInitialState: function() {
                        return {
                            counter: 22
                        }
                    },
                    componentWillMount: function() {
                        this.state.counter = this.state.counter + 1;
                    }
                };

                reactMixin.onClass(reactClass, mixin);

                var obj = Object.create(reactClass.prototype);
                obj.componentWillMount();

                expect(obj.state.counter).to.be.eql(23);
            });
        });
    });

    describe('constraints overrides', function() {
        it('works with proto', function() {
            var mixin = {
                _constraints: {
                    foo: 'OVERRIDE'
                },

                foo: 1
            };

            var proto = {
                foo: 2
            }

            reactMixin(proto, mixin);

            expect(proto.foo).to.be.eql(1);
        });

        it('works with class', function() {
            var mixin = {
                _constraints: {
                    foo: 'OVERRIDE'
                },

                foo: 1
            };

            var cls = {
                foo: 2
            }

            reactMixin.onClass(cls, mixin);

            expect(cls.foo).to.be.eql(1);
        });
    });
});
